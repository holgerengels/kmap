package kmap;

import com.google.gson.*;
import org.lightcouch.*;

import java.io.IOException;
import java.io.InputStream;
import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.*;
import java.util.function.Consumer;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;

import static java.util.Objects.requireNonNullElse;
import static kmap.JSON.*;

/**
 * Created by holger on 04.04.17.
 */
public class Couch extends Server {

    private final CouchConnection connection;

    public Couch(Properties properties) {
        super(properties);
        connection = new CouchConnection(properties);
    }

    protected CouchDbClient createClient(String name) {
        return connection.createClient(name);
    }

    Gson getGson() {
        return createClient("map").getGson();
    }

    public synchronized JsonArray loadModule(String subject, String module) {
        List<JsonObject> objects = loadModuleAsList(subject, module);
        return toArray(objects);
    }

    private List<JsonObject> loadModuleAsList(String subject, String module) {
        View view = createClient("map").view("net/byModule")
            .key(subject, module)
            .reduce(false)
            .includeDocs(true);
        List<JsonObject> objects = view.query(JsonObject.class);
        objects.removeIf(o -> string(o, "chapter") == null || string(o,"topic") == null);
        objects.forEach(o -> o.addProperty("module", module));
        objects.forEach(o -> {
            JsonArray attachments = o.getAsJsonArray("attachments");
            JsonObject _attachments = o.getAsJsonObject("_attachments");
            o.add("attachments", amendAttachments(attachments, _attachments));
            fixAttachments(attachments, subject, string(o, "chapter"), string(o, "topic"));
            o.remove("_attachments");
        });
        objects.sort(Comparator.comparing((JsonObject o) -> string(o, "chapter")).thenComparing(o -> string(o, "topic")));
        return objects;
    }

    public JsonArray latest(String subject, int n, boolean includeChapters) {
        View view = createClient("map").view("net/byModified")
                .startKey(subject, Long.MAX_VALUE)
                .endKey(subject, Long.MIN_VALUE)
                .reduce(false)
                .descending(true)
                .includeDocs(true);
        List<JsonObject> objects = view.query(JsonObject.class);
        if (includeChapters)
            objects.removeIf(o -> string(o, "chapter") == null
                    || string(o,"topic") == null
                    || ("_".equals(string(o, "topic")) && stringTrim(o, "summary") == null));
        else
            objects.removeIf(o -> string(o, "chapter") == null
                    || string(o,"topic") == null
                    || "_".equals(string(o, "topic"))
                    || string(o,"description") == null
                    || stringTrim(o,"description").length() == 0);

        if (n < objects.size())
            objects = objects.subList(0, n);
        objects.forEach(JSON::removeEmptyStrings);
        objects.forEach(o -> {
            JsonArray attachments = o.getAsJsonArray("attachments");
            JsonObject _attachments = o.getAsJsonObject("_attachments");
            o.add("attachments", amendAttachments(attachments, _attachments));
            fixAttachments(attachments, subject, string(o, "chapter"), string(o, "topic"));
            o.remove("_attachments");
        });
        return toArray(objects);
    }

    public synchronized JsonArray loadModules() {
        View view = createClient("map").view("net/availableModules")
            .group(true)
            .reduce(true);
        List<JsonObject> objects = view.query(JsonObject.class);
        List<JsonObject> modules = new ArrayList<>();
        objects.forEach(object -> {
            JsonObject module = new JsonObject();
            module.addProperty("subject", object.getAsJsonArray("key").get(0).getAsString());
            module.addProperty("module", object.getAsJsonArray("key").get(1).getAsString());
            module.addProperty("count", object.get("value").getAsNumber());
            modules.add(module);
        });
        modules.sort(Comparator
            .comparing((JsonObject o) -> o.getAsJsonPrimitive("subject").getAsString())
            .thenComparing(o -> o.getAsJsonPrimitive("module").getAsString())
        );
        return toArray(modules);
    }

    public JsonArray loadSubjects() {
        View view = createClient("map").view("net/availableModules")
            .group(true)
            .reduce(true);
        List<JsonObject> objects = view.query(JsonObject.class);
        List<JsonObject> modules = new ArrayList<>();
        objects.forEach(object -> {
            JsonObject subject = new JsonObject();
            subject.addProperty("subject", object.getAsJsonArray("key").get(0).getAsString());
            subject.addProperty("count", object.get("value").getAsNumber());
            modules.add(subject);
        });
        Map<String, Integer> map = modules.stream().collect(Collectors.groupingBy(s -> JSON.string(s, "subject"), Collectors.summingInt(c -> integer(c, "count"))));
        JsonArray array = new JsonArray();
        map.entrySet().stream().filter(entry -> !"Hilfe".equals(entry.getKey())).sorted(Map.Entry.comparingByKey()).distinct().forEach(e -> {
            JsonObject subject = new JsonObject();
            subject.addProperty("name", e.getKey());
            subject.addProperty("count", e.getValue());
            array.add(subject);
        });
        return array;
    }

    public synchronized String storeTopic(String subject, String module, String json, Map<String, Upload> uploads) {
        CouchDbClient client = createClient("map");
        JsonObject object = client.getGson().fromJson(json, JsonObject.class);
        if (object.has("delete")) {                                 // delete
            JsonObject old = (JsonObject)object.get("delete");
            String chapter = string(old, "chapter");
            String topic = string(old, "topic");
            assert chapter != null;
            assert topic != null;
            List<JsonObject> array = loadModuleAsList(subject, module);
            int pos = -1;
            for (JsonObject element : array) {
                pos++;
                if (equals(element, subject, chapter, topic)) {
                    client.remove(element);
                    return "delete:" + pos;
                }
            }
            return "reload:";
        }
        else if (object.has("rename")) {
            JsonObject rename = (JsonObject)object.get("rename");
            String chapter = string(rename, "chapter");
            String topic = string(rename, "topic");
            String newChapter = string(object, "newChapter");
            String newTopic = string(object, "newTopic");
            assert chapter != null;
            assert topic != null;
            assert newChapter != null;
            assert newTopic != null;
            boolean chapterChange = !chapter.equals(newChapter);
            List<JsonObject> list = loadChapterAsList(subject, chapter);
            for (JsonObject element : list) {
                if (equals(element, subject, chapter, topic)) {
                    element.addProperty("chapter", newChapter);
                    element.addProperty("topic", newTopic);
                    element.remove("depends");
                    client.update(element);
                }
                else if (equals(element, subject, chapter, null)) {
                    boolean change = false;
                    JsonArray depends = element.getAsJsonArray("depends");
                    JsonArray newDepends = new JsonArray(depends.size());
                    for (int i = 0; i < depends.size(); i++) {
                        if (depends.get(i).getAsString().equals(topic)) {
                            if (!chapterChange)
                                newDepends.add(new JsonPrimitive(newTopic));
                            change = true;
                        }
                        else
                            newDepends.add(depends.get(i));
                    }
                    if (change) {
                        element.add("depends", newDepends);
                        client.update(element);
                    }
                }
            }
            return "reload:";
        }
        else if (object.has("move")) {
            JsonObject move = (JsonObject)object.get("move");
            String chapter = string(move, "chapter");
            String topic = string(move, "topic");
            String nmodule = string(object, "module");
            assert chapter != null;
            assert topic != null;
            assert nmodule != null;
            List<JsonObject> array = loadModuleAsList(subject, module);
            for (JsonObject element : array) {
                if (equals(element, subject, chapter, topic)) {
                    element.addProperty("module", nmodule);
                    client.update(element);
                }
            }
            return "reload:";
        }
        else {
            JsonObject changed = (JsonObject)object.get("changed");
            if (changed.get("priority") != null && (changed.get("priority").isJsonNull() || string(changed, "priority") == null))
                changed.remove("priority");

            String command;
            if (object.has("old")) {                                // update
                command = "move:";
                JsonObject old = (JsonObject)object.get("old");
                String chapter = string(old, "chapter");
                String topic = string(old, "topic");
                assert chapter != null;
                assert topic != null;

                JsonObject existing = loadTopic(client, new String[] { subject, chapter, topic });
                if (existing != null) {
                    existing.addProperty("subject", subject);
                    existing.addProperty("modified", System.currentTimeMillis());
                    existing.add("author", changed.get("author"));
                    existing.add("chapter", changed.get("chapter"));
                    existing.add("topic", changed.get("topic"));
                    existing.add("links", changed.get("links"));
                    existing.add("depends", changed.get("depends"));
                    existing.add("priority", changed.get("priority"));
                    existing.add("keywords", changed.get("keywords"));
                    existing.add("sgs", changed.get("sgs"));
                    existing.add("educationalLevel", changed.get("educationalLevel"));
                    existing.add("educationalContext", changed.get("educationalContext"));
                    existing.add("typicalAgeRange", changed.get("typicalAgeRange"));
                    existing.add("description", changed.get("description"));
                    existing.add("thumb", changed.get("thumb"));
                    existing.add("summary", changed.get("summary"));
                    existing.add("attachments", changed.get("attachments"));
                    if (checks(changed)) {
                        Response response = client.update(existing);
                        JsonArray attachments = changed.getAsJsonArray("attachments");
                        response = saveFiles(client, response, uploads, attachments);
                        JsonObject _attachments = existing.getAsJsonObject("_attachments");
                        deleteFiles(client, response, attachments, _attachments);
                    }
                    else
                        return "error:module, subject, chapter or topic missing";
                }
            }
            else {
                command = "add:";                                               // save
                changed.remove("added");
                changed.addProperty("subject", subject);
                long millis = System.currentTimeMillis();
                changed.addProperty("created", millis);
                changed.addProperty("modified", millis);
                if (checks(changed)) {
                    Response response = client.save(changed);
                    JsonArray attachments = changed.getAsJsonArray("attachments");
                    saveFiles(client, response, uploads, attachments);
                }
                else
                    return "error:module, subject, chapter or topic missing";
            }

            return "reload:";
        }
    }

    private Response saveFiles(CouchDbClient client, Response response, Map<String, Upload> uploads, JsonArray attachments) {
        for (JsonElement alement : attachments) {
            String file = string((JsonObject)alement,"file");
            if (file != null) {
                Upload upload = uploads.get(file);
                if (upload != null) {
                    try {
                        System.out.println("saving " + upload);
                        response = client.saveAttachment(Files.newInputStream(upload.tmp), encode(upload.fileName), upload.contentType, response.getId(), response.getRev());
                    }
                    catch (IOException e) {
                        e.printStackTrace();
                    }
                }
            }
        }
        return response;
    }

    private Response deleteFiles(CouchDbClient client, Response response, JsonArray attachments, JsonObject _attachments) {
        if (_attachments == null)
            return response;

        Set<String> existingNames = _attachments.keySet();
        for (JsonElement alement : attachments) {
            String file = string((JsonObject)alement,"file");
            if (file != null) {
                System.out.println("keeping " + file);
                existingNames.remove(file);
            }
        }
        for (String name : existingNames) {
            System.out.println("removing " + name);
            response = client.removeAttachment(encode(name), response.getId(), response.getRev());
        }
        return response;
    }

    public String[] importAttachment(String[] idrev, String file, String contentType , InputStream in) {
        CouchDbClient client = createClient("map");
        String[] dirs = file.split("/");
        if (idrev == null) {
            JsonObject object = loadTopic(client, dirs);
            String id = string(object,"_id");
            String rev = string(object,"_rev");
            idrev = new String[] { id, rev };
        }
        Response response = client.saveAttachment(in, encode(dirs[3]), contentType, idrev[0], idrev[1]);
        return new String[] { response.getId(), response.getRev() };
    }

    private boolean checks(JsonObject object) {
        return !isNull(object, "module") && string(object, "module") != null
            && !isNull(object, "subject") && string(object, "subject") != null
            && !isNull(object, "chapter") && string(object, "chapter") != null
            && !isNull(object, "topic") && string(object, "topic") != null;
    }

    private boolean equals(JsonObject element, String subject, String chapter, String topic) {
        return subject.equals(string(element, "subject")) &&
            chapter.equals(string(element, "chapter")) &&
            (topic == null || topic.equals(string(element, "topic")));
    }

    public synchronized JsonObject chapter(String subject, String name) {
        return chapter(subject, name, false);
    }
    public synchronized JsonObject chapter(String subject, String name, boolean includeContent) {
        List<JsonObject> objects = loadChapterAsList(subject, name);
        Map<String, Node> nodes = new HashMap<>();
        Map<String, Connection> connections = new HashMap<>();

        JsonObject board = new JsonObject();
        board.addProperty("subject", subject);
        board.addProperty("chapter", name);
        Map<String, Set<String>> aggregates = new HashMap<>();
        Map<String, String> links = links(subject);
        //debugLinks(subject, links);
        MultiMap<String, String> deps = deps(subject);
        //debugDeps(subject, deps);
        JsonArray lines = new JsonArray();
        board.add("lines", lines);

        Node chapterNode = null;
        for (Iterator<JsonObject> iterator = objects.iterator(); iterator.hasNext(); ) {
            JsonObject topic = iterator.next();
            String topicName = string(topic, "topic");
            if ("_".equals(topicName)) {
                chapterNode = new Node("_");
                chapterNode.setModule(string(topic, "module"));
                chapterNode.setCreated(loong(topic, "created"));
                chapterNode.setModified(loong(topic, "modified"));
                chapterNode.setAuthor(string(topic, "author"));
                chapterNode.setKeywords(string(topic, "keywords"));
                chapterNode.setSGS(string(topic, "sgs"));
                chapterNode.setEducationalLevel(string(topic, "educationalLevel"));
                chapterNode.setEducationalContext(string(topic, "educationalContext"));
                chapterNode.setTypicalAgeRange(string(topic, "typicalAgeRange"));
                if (includeContent)
                    chapterNode.setDescription(string(topic, "description"));
                chapterNode.setSummary(string(topic, "summary"));
                chapterNode.setAttachments(amendAttachments(topic.getAsJsonArray("attachments"), topic.getAsJsonObject("_attachments")));
                iterator.remove();
            }
            else {
                Node node = new Node(topicName);
                node.setModule(string(topic, "module"));
                node.setCreated(loong(topic, "created"));
                node.setModified(loong(topic, "modified"));
                node.setAuthor(string(topic, "author"));
                node.setKeywords(string(topic, "keywords"));
                node.setSGS(string(topic, "sgs"));
                node.setEducationalLevel(string(topic, "educationalLevel"));
                node.setEducationalContext(string(topic, "educationalContext"));
                node.setTypicalAgeRange(string(topic, "typicalAgeRange"));
                if (includeContent)
                    node.setDescription(string(topic, "description"));
                node.setSummary(string(topic, "summary"));
                node.setThumb(string(topic, "thumb"));
                node.setPriority(integer(topic, "priority"));
                node.setLinks(string(topic, "links"));
                node.setAttachments(amendAttachments(topic.getAsJsonArray("attachments"), topic.getAsJsonObject("_attachments")));
                nodes.put(topicName, node);
            }
        }
        for (JsonObject topic : objects) {
            JsonArray depends = topic.getAsJsonArray("depends");
            String topicName = string(topic, "topic");
            Node node = nodes.get(topicName);
            if (depends != null) {
                for (JsonElement depend : depends) {
                    String dependsOn = depend.getAsString();
                    //System.out.println("--> " + dependsOn);
                    Connection connection = connections.computeIfAbsent(dependsOn + ":" + topicName, s -> {
                        Node source = nodes.get(dependsOn);
                        if (source == null) {
                            System.out.println("WARNING: source node " + dependsOn + " missing");
                            return null;
                        }
                        Node target = nodes.get(topicName);
                        if (target == null) {
                            System.out.println("WARNING: target node" + topicName + " missing");
                            return null;
                        }
                        return new Connection(source, target);
                    });
                    if (connection == null)
                        node.getAnnotations().add("inconsistent dependency");

                    node.getDepends().add(dependsOn);
                }
            }
        }

        List<String> transitiveDepends = new ArrayList<>();
        deps.entrySet().stream().filter(entry -> entry.getKey().equals(name)).flatMap(entry -> entry.getValue().stream()).forEach(depend -> {
            int i = depend.indexOf('.');
            String dependChapter = depend.substring(0, i);
            String dependTopic = depend.substring(i + 1);
            transitiveDepends.add(links.containsKey(depend) ? links.get(depend) : dependChapter + "/" + dependTopic);
        });

        if (chapterNode == null)
            chapterNode = new Node("_");

        if (!transitiveDepends.isEmpty()) {
            chapterNode.getDepends().addAll(transitiveDepends);
        }

        List<Node> list = layout(nodes, connections);

        JsonObject line;
        JsonArray cards = new JsonArray();

        int row = 0;
        for (Node node : list) {
            if (node.row != row) {
                line = new JsonObject();
                cards = new JsonArray();
                line.add("cards", cards);
                lines.add(line);
                row++;
            }
            fixAttachments(node.getAttachments(), subject, name, node.getTopic());
            JsonObject card = new JsonObject();
            if (node.getCreated() != null)
                card.addProperty("created", node.getCreated());
            if (node.getModified() != null)
                card.addProperty("modified", node.getModified());
            if (node.getAuthor() != null)
                card.addProperty("author", node.getAuthor());
            card.addProperty("module", node.getModule());
            card.addProperty("topic", node.getTopic());
            card.addProperty("row", node.getRow());
            card.addProperty("col", node.getColumn());
            JSON.addProperty(card, "keywords", node.getKeywords());
            JSON.addProperty(card, "sgs", node.getSGS());
            JSON.addProperty(card, "educationalLevel", node.getEducationalLevel());
            JSON.addProperty(card, "educationalContext", node.getEducationalContext());
            JSON.addProperty(card, "typicalAgeRange", node.getTypicalAgeRange());
            if (includeContent)
                JSON.addProperty(card, "description", node.getDescription());
            JSON.addProperty(card, "summary", node.getSummary());
            JSON.addProperty(card, "thumb", node.getThumb());
            JSON.addProperty(card, "links", node.getLinks());
            add(card, "attachments", node.getAttachments());
            JsonArray depends = new JsonArray();
            JsonArray dependencies = new JsonArray();
            for (String dependName : node.getDepends()) {
                depends.add(dependName);
                String link = links.get(name + "." + dependName);
                dependencies.add(link != null ? link : name + "/" + dependName);
            }
            card.add("depends", depends);
            card.add("dependencies", dependencies);
            card.addProperty("annotations", String.join(", ", node.getAnnotations()));
            JSON.addProperty(card, "priority", node.getPriority());
            cards.add(card);
        }

        if (chapterNode != null) {
            chapterNode.setLinks(String.join("/", backlinks(links, name)));
            fixAttachments(chapterNode.getAttachments(), subject, name, "_");
            JsonObject card = new JsonObject();
            card.addProperty("module", chapterNode.getModule());
            card.addProperty("topic", "_");
            if (!chapterNode.getDepends().isEmpty()) {
                JsonArray array = new JsonArray();
                chapterNode.getDepends().forEach(array::add);
                add(card, "dependencies", array);
            }
            JSON.addProperty(card, "keywords", chapterNode.getKeywords());
            JSON.addProperty(card, "sgs", chapterNode.getSGS());
            JSON.addProperty(card, "educationalLevel", chapterNode.getEducationalLevel());
            JSON.addProperty(card, "educationalContext", chapterNode.getEducationalContext());
            JSON.addProperty(card, "typicalAgeRange", chapterNode.getTypicalAgeRange());
            if (includeContent)
                JSON.addProperty(card, "description", chapterNode.getDescription());
            JSON.addProperty(card, "summary", chapterNode.getSummary());
            JSON.addProperty(card, "links", chapterNode.getLinks());
            add(card, "attachments", chapterNode.getAttachments());
            board.add("chapterCard", card);
        }
        return board;
    }

    private List<JsonObject> loadChapterAsList(String subject, String name) {
        View view = createClient("map").view("net/byChapter")
            .key(subject, name)
            .reduce(false)
            .includeDocs(true);
        return view.query(JsonObject.class);
    }

    private List<String> backlinks(Map<String, String> links, String name) {
        List<String> backlinks = new ArrayList<>();
        for (Map.Entry<String, String> entry : links.entrySet()) {
            if (name.equals(entry.getValue()))
                backlinks.add(entry.getKey().split("\\.")[0]);
        }
        return backlinks;
    }

    private JsonArray amendAttachments(JsonArray attachments, JsonObject _attachments) {
        if (attachments == null)
            attachments = new JsonArray();

        Set<String> existing = StreamSupport.stream(attachments.spliterator(), false)
                .filter(a -> string((JsonObject) a, "file") != null)
                .map(a -> string((JsonObject) a, "file"))
                .collect(Collectors.toSet());

        if (_attachments != null) {
            for (Map.Entry<String, JsonElement> entry : _attachments.entrySet()) {
                String file = entry.getKey();
                JsonObject object = (JsonObject)entry.getValue();
                if (existing.contains(file))
                    continue;

                String type = string(object, "content_type");
                JsonObject attachment = attachmentFromAttachment(file, type);
                attachments.add(attachment);
            }
        }
        return attachments;
    }

    public JsonObject attachmentFromAttachment(String file, String type) {
        JsonObject attachment = new JsonObject();
        attachment.addProperty("type", "file");
        attachment.addProperty("name", file);
        attachment.addProperty("file", file);
        attachment.addProperty("mime", type);
        return attachment;
    }

    private void debugLinks(String subject, Map<String, String> links) {
        String fileName = "/tmp/chapter-links.csv";
        try {
            Files.write(Paths.get(fileName),
                    links.entrySet().stream().map(entry -> "\"" + subject + "." + entry.getKey() + "\", \"" + entry.getValue() + "\"").collect(Collectors.toList()));
        }
        catch (IOException e) {
            e.printStackTrace();
        }
    }

    private void debugDeps(String subject, MultiMap<String, String> deps) {
        String fileName = "/tmp/chapter-deps.csv";
        try {
            Files.write(Paths.get(fileName),
                    deps.entrySet().stream().map(entry -> "\"" + subject + "." + entry.getKey() + "\", \"" + entry.getValue() + "\"").collect(Collectors.toList()));
        }
        catch (IOException e) {
            e.printStackTrace();
        }
    }

    void fixAttachments(JsonArray array, String subject, String chapter, String topic) {
        if (array == null)
            return;

        for (JsonElement element: array) {
            JsonObject attachment = (JsonObject)element;
            String name = string(attachment, "name");
            String file = string(attachment, "file");
            String type = string(attachment, "type");
            String mime = string(attachment, "mime");
            String href = string(attachment, "href");
            if ("link".equals(type)) {
                if (mime == null) {
                    mime = "text/html";
                    attachment.addProperty("mime", mime);
                }
            }
            else if ("file".equals(type)) {
                if (file == null && name != null) {
                    file = name;
                    attachment.addProperty("file", file);
                }
                if (mime == null && file != null) {
                    mime = MimeTypes.guessType(file);
                    attachment.addProperty("mime", mime);
                }
                String fileName = encode(file);
                String path = "data/" + encode(subject) + "/" + encode(chapter) + "/" + encode(topic) + "/" + fileName;
                attachment.addProperty("href", path);
            }
            else {
                if (mime == null && type.contains("/")) {
                    mime = type;
                    attachment.addProperty("mime", mime);
                    type = "file";
                    attachment.addProperty("type", type);
                }
                if (file == null && name != null) {
                    file = name;
                    attachment.addProperty("file", file);
                }
                String fileName = encode(file);
                String path = "data/" + encode(subject) + "/" + encode(chapter) + "/" + encode(topic) + "/" + fileName;
                attachment.addProperty("href", path);
            }
        }
    }

    public boolean loadAttachment(Consumer<AttachmentInputStream> sender, String... dirs) throws IOException {
        CouchDbClient client = createClient("map");
        JsonObject object = loadTopic(client, dirs);
        String id = string(object,"_id");
        JsonObject attachments = object.getAsJsonObject("_attachments");
        String type = null;
        Integer length = null;
        InputStream in = null;
        if (attachments != null) {
            System.out.println("loadAttachment = " + Arrays.toString(dirs));
            JsonObject attachment = attachments.getAsJsonObject(dirs[3]);
            if (attachment != null) {
                type = string(attachment, "content_type");
                length = integer(attachment, "length");
                in = client.find(id + "/" + encode(dirs[3]));
                //System.out.println("Load " + id + "/" + dirs[3] + " from couch");
                sender.accept(new AttachmentInputStream(in, dirs[3], type, length));
                in.close();
                return true;
            }
        }
        return false;
    }

    public void fix(String path, List<JsonObject> list) {
        String[] dirs = path.split("/");
        CouchDbClient client = createClient("map");
        JsonObject object = loadTopic(client, dirs);
        JsonArray attachments = object.getAsJsonArray("attachments");
        if (attachments == null)
            attachments = new JsonArray();
        list.forEach(attachments::add);
        object.add("attachments", attachments);
        client.update(object);
    }

    public JsonObject loadTopic(String... dirs) {
        CouchDbClient client = createClient("map");
        return loadTopic(client, dirs);
    }

    private JsonObject loadTopic(CouchDbClient client, String[] dirs) {
        View view = client.view("net/byTopic")
                .key(dirs[0], dirs[1], dirs[2])
                .reduce(false)
                .includeDocs(true);
        List<JsonObject> objects = view.query(JsonObject.class);
        JsonObject o = objects.size() == 1 ? objects.get(0) : null;
        JsonArray attachments = o.getAsJsonArray("attachments");
        JsonObject _attachments = o.getAsJsonObject("_attachments");
        o.add("attachments", amendAttachments(attachments, _attachments));
        fixAttachments(attachments, dirs[0], string(o, "chapter"), string(o, "topic"));
        //o.remove("_attachments");
        return o;
    }

    public synchronized JsonArray search(String filter) {
        CouchDbClient client = createClient("map");
        String uri = client.getBaseUri() + "_fti/local/" + "map" + "/_design/net/search?q=content:" + filter;
        JsonObject result = client.findAny(JsonObject.class, uri);
        System.out.println("search result = " + result);
        return result.getAsJsonArray("rows");
    }

    private String encode(String string) {
        try {
            return URLEncoder.encode(string, "UTF-8").replace("+", "%20");
        }
        catch (UnsupportedEncodingException e) {
            throw new RuntimeException(e);
        }
    }

    public Map<String, String> links(String subject) {
        int index = subject.length() + 1;
        View view = createClient("map")
            .view("net/links")
            .startKey(subject + ".")
            .endKey((subject + ".\uffff"))
            .reduce(false);
        List<JsonObject> objects = view.query(JsonObject.class);
        return objects.stream().collect(Collectors.toMap(object -> string(object, "key").substring(index), object -> string(object, "value").substring(index), (a, b) -> b));
    }

    public MultiMap<String, String> deps(String subject) {
        int index = subject.length() + 1;
        View view = createClient("map")
            .view("net/deps")
            .startKey(subject + ".")
            .endKey((subject + ".\uffff"))
            .reduce(false);
        List<JsonObject> objects = view.query(JsonObject.class);
        MultiMap<String, String> deps = new MultiMap<>();
        objects.stream().forEach(object -> deps.put(string(object, "key").substring(index), string(object, "value").substring(index)));
        return deps;
    }

    public JsonObject dependencies(String subject) {
        MultiMap<String, String> deps = deps(subject);
        JsonObject chapters = new JsonObject();
        for (Map.Entry<String, Set<String>> entry : deps.entrySet()) {
            JsonArray array = new JsonArray();
            entry.getValue().forEach(array::add);
            chapters.add(entry.getKey(), array);
        }
        return chapters;
    }

    public JsonArray tree(String subject) {
        Map<String, String> links = links(subject);
        List<String> paths = new ArrayList<>();

        for (String chapter : links.values()) {
            String path = chapter;
            String parent = chapter;
            while ((parent = findParent(links, parent)) != null) {
                path = path.replace(chapter, parent);
                parent = parent.substring(0, parent.indexOf("."));
                chapter = parent;
            }
            paths.add(path.substring(subject.length() + 1));
        }
        Collections.sort(paths);
        //System.out.println("paths = " + paths);
        JsonArray array = new JsonArray();
        paths.forEach(array::add);
        return array;
    }

    private String findParent(Map<String, String> links, String chapter) {
        for (String key : links.keySet()) {
            if (key.endsWith("." + chapter))
                return key;
        }
        return null;
    }

    protected Set<String> aggregates(Map<String, String> links, Map<String, Set<String>> aggregates, String chapter) {
        Set<String> list = aggregates.get(chapter);
        if (list != null)
            return list;

        list = new HashSet<>();
        aggregates.put(chapter, list);

        for (Map.Entry<String, String> entry : links.entrySet()) {
            if (entry.getKey().startsWith(chapter + ".")) {
                list.add(entry.getValue());
                list.addAll(aggregates(links, aggregates, entry.getValue()));
            }
        }

        return list;
    }

    public JsonArray chapters(String subject) {
        View view = createClient("map").view("net/chapters")
            .key(subject)
            .reduce(false)
            .includeDocs(false);
        List<JsonObject> objects = view.query(JsonObject.class);
        JsonArray array = new JsonArray();
        objects.stream().map(object -> string(object, "value")).distinct().forEach(array::add);
        return array;
    }

    public JsonArray topics(String subject, String chapter) {
        View view = createClient("map").view("net/topics")
            .key(subject, chapter)
            .reduce(false)
            .includeDocs(false);
        List<JsonObject> objects = view.query(JsonObject.class);
        JsonArray array = new JsonArray();
        objects.stream().map(object -> string(object, "value").split("\\.")[1]).distinct().forEach(array::add);
        return array;
    }

    public JsonArray topics(String subject) {
        JsonArray array = new JsonArray();
        topicsAsList(subject).forEach(array::add);
        return array;
    }
    public List<String> topicsAsList(String subject) {
        View view = createClient("map")
            .view("net/topics")
            .startKey(subject, "\u0000")
            .endKey(subject, "\uffff")
            .reduce(false);
        List<JsonObject> objects = view.query(JsonObject.class);
        return objects.stream().map(object -> string(object, "value")).collect(Collectors.toList());
    }

    Map<String, Integer> counts(String subject) {
        int index = subject.length() + 1;
        View view = createClient("map")
            .view("net/count")
            .startKey(subject + ".")
            .endKey((subject + ".\uffff"))
            .reduce(true)
            .group(true);
        List<JsonObject> objects = view.query(JsonObject.class);
        return objects.stream().collect(Collectors.toMap(object -> string(object, "key").substring(index), object -> integer(object, "value"), (a, b) -> b));
    }

    private List<Node> layout(Map<String, Node> nodes, Map<String, Connection> connections) {
        Set<Node> nodeSet = new HashSet<>(nodes.values());
        Set<Connection> connectionSet = new HashSet<>(connections.values());
        NodeLayouter.layout(nodeSet, connectionSet);
        List<Node> list = new ArrayList<>(nodeSet);
        list.sort((o1, o2) -> {
            if (o1.row != o2.row)
                return o1.row - o2.row;
            else
                return o1.column - o2.column;
        });
        return list;
    }

    public void walk(String subject) {
        List<String> book = new ArrayList<>();
        Map<String, String> links = links(subject);
        walk(book, links, subject, subject);
        book.forEach(System.out::println);
    }

    public void walk(List<String> book, Map<String, String> links, String subject, String chapter) {
        book.add(chapter);
        JsonObject chapterObject = chapter(subject, chapter, true);
        for (JsonElement lineObject : chapterObject.getAsJsonArray("lines")) {
            for (JsonElement topicObject : ((JsonObject)lineObject).getAsJsonArray("cards")) {
                book.add(chapter + "." + string((JsonObject)topicObject, "topic"));
                String consists = string((JsonObject)topicObject, "links");
                if (consists != null) {
                    walk(book, links, subject, links.get(chapter + "." + consists));
                }
            }
        }
    }

    public JsonObject importModule(String subject, String module, String json) {
        CouchDbClient client = createClient("map");
        JsonObject data = client.getGson().fromJson(json, JsonObject.class);
        System.out.println("data = " + data);
        JsonArray array = (JsonArray)data.get("docs");
        List<JsonObject> newTopics = new ArrayList<>();
        for (JsonElement element : array) {
            JsonObject object = (JsonObject)element;
            object.addProperty("subject", subject);
            object.addProperty("module", module);
            long millis = System.currentTimeMillis();
            if (loong(object, "created") == null)
                object.addProperty("created", millis);
            if (loong(object, "modified") == null)
                object.addProperty("modified", millis);
            object.remove("_id");
            object.remove("_rev");
            newTopics.add(object);
        }
        List<JsonObject> oldTopics = loadModuleAsList(subject, module);
        for (JsonObject object : oldTopics) {
            object.addProperty("_deleted", true);
        }
        System.out.println("oldTopics = " + oldTopics);
        System.out.println("newTopics = " + newTopics);
        if (!oldTopics.isEmpty())
            client.bulk(oldTopics, true);
        client.bulk(newTopics, true);

        JsonObject object = new JsonObject();
        object.addProperty("subject", subject);
        object.addProperty("module", module);
        object.addProperty("count", newTopics.size());
        return object;
    }

    public JsonObject deleteModule(String subject, String module) {
        CouchDbClient client = createClient("map");
        List<JsonObject> oldTopics = loadModuleAsList(subject, module);
        for (JsonObject object : oldTopics) {
            object.addProperty("_deleted", true);
        }
        System.out.println("oldTopics = " + oldTopics);
        List<Response> responses = client.bulk(oldTopics, true);
        System.out.println("responses = " + responses);

        JsonObject object = new JsonObject();
        object.addProperty("subject", subject);
        object.addProperty("module", module);
        object.addProperty("count", oldTopics.size());
        return object;
    }

    public synchronized JsonArray checks(String subject) {
        View view = createClient("map").view("net/bySubject")
                .key(subject)
                .reduce(false)
                .includeDocs(true);

        JsonArray messages = new JsonArray();
        List<JsonObject> objects = view.query(JsonObject.class);
        for (JsonObject object : objects) {
            JsonObject _attachments = object.getAsJsonObject("_attachments");
            Set<String> names = _attachments != null ? _attachments.keySet() : Collections.emptySet();
            JsonArray attachments = requireNonNullElse(object.getAsJsonArray("attachments"), new JsonArray());
            for (JsonElement element : attachments) {
                JsonObject attachment = (JsonObject)element;
                if ("file".equals(JSON.string(attachment, "type"))) {
                    if (!names.contains(JSON.string(attachment, "file"))) {
                        System.out.println(formatIdentity(object) + ": lost the file for " + JSON.string(attachment, "name"));
                        JsonObject message = new JsonObject();
                        message.addProperty("id", JSON.string(object, "_id"));
                        message.addProperty("chapter", JSON.string(object, "chapter"));
                        message.addProperty("topic", JSON.string(object, "topic"));
                        message.addProperty("message", "lost the file for " + JSON.string(attachment, "name"));
                        messages.add(message);
                    }
                }
            }
            String summary = string(object, "summary");
            String description = string(object, "description");
            String links = string(object, "links");
            if (links == null && nully(description)) {
                System.out.println(formatIdentity(object) + ": has no description");
                JsonObject message = new JsonObject();
                message.addProperty("id", JSON.string(object, "_id"));
                message.addProperty("chapter", JSON.string(object, "chapter"));
                message.addProperty("topic", JSON.string(object, "topic"));
                message.addProperty("message", ": has no description");
                messages.add(message);
            }
            else if (links == null && !nully(description) && nully(summary)) {
                System.out.println(formatIdentity(object) + ": has no summary");
                JsonObject message = new JsonObject();
                message.addProperty("id", JSON.string(object, "_id"));
                message.addProperty("chapter", JSON.string(object, "chapter"));
                message.addProperty("topic", JSON.string(object, "topic"));
                message.addProperty("message", ": has no summary");
                messages.add(message);
            }
        }
        return messages;
    }

    private boolean nully(String value) {
        return value == null || value.trim().length() == 0;
    }

    private String formatIdentity(JsonObject object) {
        return JSON.string(object, "_id") + ": " + JSON.string(object, "chapter") + "/" + JSON.string(object, "topic");
    }

    public synchronized JsonArray list(String subject, String chapter) {
        CouchDbClient client = createClient("map");
        View view = chapter != null
                ? client.view("net/byChapter").key(subject, chapter).reduce(false).includeDocs(true)
                : client.view("net/bySubject").key(subject).reduce(false).includeDocs(true)
                ;

        JsonArray list = new JsonArray();
        List<JsonObject> objects = view.query(JsonObject.class);
        for (JsonObject object : objects) {
            JsonObject line = new JsonObject();
            chapter = JSON.string(object, "chapter");
            String topic = JSON.string(object, "topic");
            if ("_".equals(topic))
                continue;
            line.addProperty("subject", subject);
            line.addProperty("chapter", chapter);
            line.addProperty("topic", topic);
            list.add(line);
        }
        return list;
    }

    private void addProperty(CouchDbClient client, String[] dirs, String name, JsonElement element) {
        JsonObject object = loadTopic(dirs);
        object.add(name, element);
        client.update(object);
    }

    public static void main(String[] args) throws IOException {
        Couch couch = new Couch(readProperties(args[0]));
        Server.CLIENT.set("root");
        Pattern pattern = Pattern.compile(".*[0-9]+,[0-9]+.*", Pattern.DOTALL);
        List<JsonObject> objects = couch.loadModuleAsList("Mathematik", "Analysis");
        System.out.println("objects.size() = " + objects.size());
        objects = objects.stream().filter(o -> {
            String description = string(o, "description");
            return description != null && pattern.matcher(description).matches();
        }).collect(Collectors.toList());
        System.out.println("objects.size() = " + objects.size());
        System.out.println("objects = " + objects.stream().map(o -> string(o, "chapter") + " " + string(o, "topic") + "\n").collect(Collectors.toList()));
        Server.CLIENT.remove();
    }

    /*
    public static void main(String[] args) throws IOException {
        Couch couch = new Couch(readProperties(args[0]));
        if (args.length != 4) {
            System.err.println("Usage: <kmap.properties> name value <topics>");
            System.exit(1);
        }
        Server.CLIENT.set("root");
        CouchDbClient client = couch.createClient("map");
        String name = args[1];
        JsonElement value = client.getGson().fromJson(args[2], JsonElement.class);
        String json = Files.readString(Paths.get(args[3]));
        JsonArray topics = client.getGson().fromJson(json, JsonArray.class);
        for (JsonElement element : topics) {
            String[] path = {
                    JSON.string((JsonObject) element, "subject"),
                    JSON.string((JsonObject) element, "chapter"),
                    JSON.string((JsonObject) element, "topic")
            };
            couch.addProperty(client, path, name, value);
        }
        Server.CLIENT.remove();
    }
    */

    public int batchCards(String json) {
        CouchDbClient client = createClient("map");
        JsonObject batch = client.getGson().fromJson(json, JsonObject.class);
        json = string(batch, "json");
        batch = client.getGson().fromJson(json, JsonObject.class);
        JsonArray properties = batch.getAsJsonArray("properties");
        JsonArray cards = batch.getAsJsonArray("cards");
        int count = 0;
        for (JsonElement element : cards) {
            JsonObject card = (JsonObject)element;
            String[] path = {
                    string(card, "subject"),
                    string(card, "chapter"),
                    string(card, "topic")
            };
            for (JsonElement elefant : properties) {
                JsonObject property = (JsonObject)elefant;
                String name = string(property, "name");
                JsonElement value = property.get("value");
                addProperty(client, path, name, value);
            }
            count++;
        }
        return count;
    }

    static class WeightedSum {
        int sum = 0;
        int count = 0;
        int target = 0;

        WeightedSum() {
        }

        WeightedSum(int value) {
            add(value);
        }

        public WeightedSum add(WeightedSum add) {
            this.sum += add.sum;
            this.count += add.count;
            return this;
        }

        public void add(int value) {
            this.sum += value;
            this.count ++;
        }

        public void target(int target) {
            this.target += target;
        }

        public int getSum() {
            return sum;
        }

        public int getCount() {
            return count;
        }

        public int getTarget() {
            return target;
        }

        float average() {
            return count != 0 ? (float)sum / (float)count : 0;
        }

        @Override
        public String toString() {
            return sum + " / " + count + " = " + average();
        }
    }
}
