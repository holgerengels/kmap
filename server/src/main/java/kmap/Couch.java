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
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;

import static kmap.JSON.*;

/**
 * Created by holger on 04.04.17.
 */
public class Couch extends Server {

    public Couch(Properties properties) {
        super(properties);
    }


    protected CouchDbClient createClient(String name) {
        CouchDbProperties couchProperties = new CouchDbProperties()
            .setDbName(Server.CLIENT.get() + "-" + name)
            .setCreateDbIfNotExist(false)
            .setProtocol("http")
            .setHost(getProperty("kmap.host"))
            .setPort(Integer.parseInt(getProperty("kmap.port")))
            .setUsername(getProperty("kmap.user"))
            .setPassword(getProperty("kmap.password"))
            .setMaxConnections(10)
            .setConnectionTimeout(0);
        return new CouchDbClient(couchProperties);
    }

    Gson getGson() {
        return createClient("map").getGson();
    }

    public synchronized JsonArray loadModule(String subject, String module) {
        List<JsonObject> objects = loadModuleAsList(subject, module);
        JsonArray array = new JsonArray();
        objects.forEach(array::add);
        return array;
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
            fixAttachments(attachments, subject, string(o, "chapter"), string(o, "topic"));
        });
        objects.sort(Comparator.comparing((JsonObject o) -> string(o, "chapter")).thenComparing(o -> string(o, "topic")));
        return objects;
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
        JsonArray array = new JsonArray();
        modules.forEach(array::add);
        System.out.println("modules = " + array);
        return array;
    }

    public JsonArray loadSubjects() {
        View view = createClient("map").view("net/availableModules")
            .group(true)
            .reduce(true);
        List<JsonObject> objects = view.query(JsonObject.class);
        List<String> modules = new ArrayList<>();
        objects.forEach(object -> modules.add(object.getAsJsonArray("key").get(0).getAsString()));
        JsonArray array = new JsonArray();
        modules.stream().filter(m -> !"Hilfe".equals(m)).sorted().distinct().forEach(array::add);
        System.out.println("subjects = " + array);
        return array;
    }

    public synchronized String storeTopic(String subject, String module, String json, Map<String, Upload> uploads) {
        CouchDbClient client = createClient("map");
        JsonObject object = client.getGson().fromJson(json, JsonObject.class);
        if (object.has("delete")) {
            JsonObject old = (JsonObject)object.get("delete");
            String chapter = string(old, "chapter");
            String topic = string(old, "topic");
            assert chapter != null;
            assert topic != null;
            JsonArray array = loadModule(subject, module);
            int pos = -1;
            for (JsonElement element : array) {
                pos++;
                if (equals((JsonObject)element, subject, chapter, topic)) {
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
            String name = string(object, "name");
            assert chapter != null;
            assert topic != null;
            assert name != null;
            JsonArray array = loadModule(subject, module);
            for (JsonElement element : array) {
                if (equals((JsonObject)element, subject, chapter, topic)) {
                    ((JsonObject)element).addProperty("topic", name);
                    client.update(element);
                }
                else if (equals((JsonObject)element, subject, chapter, null)) {
                    boolean change = false;
                    JsonArray depends = ((JsonObject)element).getAsJsonArray("depends");
                    for (int i = 0; i < depends.size(); i++) {
                        if (depends.get(i).getAsString().equals(topic)) {
                            depends.set(i, new JsonPrimitive(name));
                            change = true;
                        }
                    }
                    if (change)
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
            if (object.has("old")) {
                command = "move:";
                JsonObject old = (JsonObject)object.get("old");
                String chapter = string(old, "chapter");
                String topic = string(old, "topic");
                assert chapter != null;
                assert topic != null;

                JsonObject existing = null;
                JsonArray array = loadModule(subject, module);
                for (JsonElement element : array) {
                    if (chapter.equals(string((JsonObject)element, "chapter")) &&
                        topic.equals(string((JsonObject)element, "topic"))) {
                        existing = (JsonObject)element;
                    }
                }

                if (existing != null) {
                    existing.addProperty("subject", subject);
                    existing.add("chapter", changed.get("chapter"));
                    existing.add("topic", changed.get("topic"));
                    existing.add("links", changed.get("links"));
                    existing.add("depends", changed.get("depends"));
                    existing.add("priority", changed.get("priority"));
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
                command = "add:";
                changed.addProperty("subject", subject);
                changed.remove("added");
                if (checks(changed)) {
                    Response response = client.save(changed);
                    JsonArray attachments = changed.getAsJsonArray("attachments");
                    saveFiles(client, response, uploads, attachments);
                }
                else
                    return "error:module, subject, chapter or topic missing";
            }

            String chapter = string(changed, "chapter");
            String topic = string(changed, "topic");
            assert chapter != null;
            assert topic != null;
            JsonArray array = loadModule(subject, module);
            int pos = -1;
            for (JsonElement element : array) {
                pos++;
                if (chapter.equals(string((JsonObject)element, "chapter")) &&
                    topic.equals(string((JsonObject)element, "topic"))) {
                    return command + pos;
                }
            }
            return "reload:";
        }
    }

    public String[] importAttachment(String[] idrev, String file, String contentType , InputStream in) {
        CouchDbClient client = createClient("map");
        String[] dirs = file.split("/");
        if (idrev == null) {
            View view = client.view("net/byTopic")
                    .key(dirs[0], dirs[1], dirs[2])
                    .reduce(false)
                    .includeDocs(true);
            List<JsonObject> objects = view.query(JsonObject.class);
            JsonObject object = objects.get(0);
            String id = string(object,"_id");
            String rev = string(object,"_rev");
            idrev = new String[] { id, rev };
        }
        Response response = client.saveAttachment(in, encode(dirs[3]), contentType, idrev[0], idrev[1]);
        return new String[] { response.getId(), response.getRev() };
    }

    private Response saveFiles(CouchDbClient client, Response response, Map<String, Upload> uploads, JsonArray attachments) {
        for (JsonElement alement : attachments) {
            String file = string((JsonObject)alement,"file");
            if (file != null) {
                Upload upload = uploads.get(file);
                if (upload != null) {
                    try {
                        System.out.println("uploading " + upload);
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
        View view = createClient("map").view("net/byChapter")
            .key(subject, name)
            .reduce(false)
            .includeDocs(true);
        List<JsonObject> objects = view.query(JsonObject.class);
        Map<String, Node> nodes = new HashMap<>();
        Map<String, Connection> connections = new HashMap<>();

        JsonObject board = new JsonObject();
        board.addProperty("subject", subject);
        board.addProperty("chapter", name);
        Map<String, Set<String>> aggregates = new HashMap<>();
        Map<String, String> links = links(subject);
        debugLinks(subject, links);
        MultiMap<String, String> deps = deps(subject);
        debugDeps(subject, deps);
        JsonArray lines = new JsonArray();
        board.add("lines", lines);

        Node chapterNode = null;
        for (Iterator<JsonObject> iterator = objects.iterator(); iterator.hasNext(); ) {
            JsonObject topic = iterator.next();
            String topicName = string(topic, "topic");
            if ("_".equals(topicName)) {
                chapterNode = new Node("_");
                chapterNode.setModule(string(topic, "module"));
                chapterNode.setDescription(string(topic, "description"));
                chapterNode.setSummary(string(topic, "summary"));
                chapterNode.setAttachments(amendAttachments(topic.getAsJsonArray("attachments"), topic.getAsJsonObject("_attachments")));
                iterator.remove();
            }
            else {
                Node node = new Node(topicName);
                node.setModule(string(topic, "module"));
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
                            System.out.println("source node " + dependsOn + " missing");
                            return null;
                        }
                        Node target = nodes.get(topicName);
                        if (target == null) {
                            System.out.println("target node" + topicName + " missing");
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

        if (!transitiveDepends.isEmpty()) {
            if (chapterNode == null)
                chapterNode = new Node("_");
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
            card.addProperty("module", node.getModule());
            card.addProperty("topic", node.getTopic());
            card.addProperty("row", node.getRow());
            card.addProperty("col", node.getColumn());
            addProperty(card, "description", node.getDescription());
            addProperty(card, "summary", node.getSummary());
            addProperty(card, "thumb", node.getThumb());
            addProperty(card, "links", node.getLinks());
            add(card, "attachments", node.getAttachments());
            JsonArray depends = new JsonArray();
            for (String dependName : node.getDepends()) {
                depends.add(dependName);
            }
            card.add("depends", depends);
            card.addProperty("annotations", String.join(", ", node.getAnnotations()));
            addProperty(card, "priority", node.getPriority());
            cards.add(card);
        }

        if (chapterNode != null) {
            fixAttachments(chapterNode.getAttachments(), subject, name, "_");
            JsonObject card = new JsonObject();
            card.addProperty("module", chapterNode.getModule());
            card.addProperty("topic", "_");
            if (!chapterNode.getDepends().isEmpty()) {
                JsonArray array = new JsonArray();
                chapterNode.getDepends().forEach(array::add);
                add(card, "depends", array);
            }
            addProperty(card, "description", chapterNode.getDescription());
            addProperty(card, "summary", chapterNode.getSummary());
            add(card, "attachments", chapterNode.getAttachments());
            board.add("chapterCard", card);
        }
        return board;
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
                if (existing.contains(entry.getKey()))
                    continue;

                String type = string((JsonObject) entry.getValue(), "content_type");
                JsonObject attachment = new JsonObject();
                attachment.addProperty("type", "file");
                attachment.addProperty("name", entry.getKey());
                attachment.addProperty("file", entry.getKey());
                attachment.addProperty("mime", type);
                attachments.add(attachment);
            }
        }
        return attachments;
    }

    private void debugLinks(String subject, Map<String, String> links) {
        String fileName = properties.getProperty("debug.chapterLinks");
        if (fileName != null) {
            try {
                Files.write(Paths.get(fileName),
                    links.entrySet().stream().map(entry -> "\"" + subject + "." + entry.getKey() + "\", \"" + entry.getValue() + "\"").collect(Collectors.toList()));
            }
            catch (IOException e) {
                e.printStackTrace();
            }
        }
    }

    private void debugDeps(String subject, MultiMap<String, String> deps) {
        String fileName = properties.getProperty("debug.chapterDeps");
        if (fileName != null) {
            try {
                Files.write(Paths.get(fileName),
                    deps.entrySet().stream().map(entry -> "\"" + subject + "." + entry.getKey() + "\", \"" + entry.getValue() + "\"").collect(Collectors.toList()));
            }
            catch (IOException e) {
                e.printStackTrace();
            }
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

    public boolean loadAttachment(Consumer<Cloud.AttachmentInputStream> sender, String... dirs) throws IOException {
        CouchDbClient client = createClient("map");
        View view = client.view("net/byTopic")
                .key(dirs[0], dirs[1], dirs[2])
                .reduce(false)
                .includeDocs(true);
        List<JsonObject> objects = view.query(JsonObject.class);
        JsonObject object = objects.get(0);
        String id = string(object,"_id");
        JsonObject attachments = object.getAsJsonObject("_attachments");
        String type = null;
        Integer length = null;
        InputStream in = null;
        if (attachments != null) {
            JsonObject attachment = attachments.getAsJsonObject(dirs[3]);
            if (attachment != null) {
                type = string(attachment, "content_type");
                length = integer(attachment, "length");
                in = client.find(id + "/" + encode(dirs[3]));
                System.out.println("Load " + id + "/" + dirs[3] + " from couch");
                sender.accept(new Cloud.AttachmentInputStream(in, dirs[3], type, length));
                in.close();
                return true;
            }
        }
        return false;
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

    private void add(JsonObject card, String name, JsonArray array) {
        if (array != null)
            card.add(name, array);
    }

    private void addProperty(JsonObject card, String name, String value) {
        if (value != null && value.length() != 0)
            card.addProperty(name, value);
    }
    private void addProperty(JsonObject card, String name, Integer value) {
        if (value != null)
            card.addProperty(name, value);
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
        System.out.println("paths = " + paths);
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
        JsonObject chapterObject = chapter(subject, chapter);
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
        List<Response> responses = client.bulk(oldTopics, false);
        System.out.println("responses = " + responses);

        JsonObject object = new JsonObject();
        object.addProperty("subject", subject);
        object.addProperty("module", module);
        object.addProperty("count", oldTopics.size());
        return object;
    }

    public static void main(String[] args) throws IOException {
        Couch couch = new Couch(readProperties(args[0]));
        Server.CLIENT.set("lala");
        String json = "[" +
                "   {" +
                "    'name': 'Alles im Fluss.md'," +
                "    'tag': 'idea'," +
                "    'type': 'text/markdown'" +
                "   }," +
                "   {" +
                "    'tag': 'explanation'," +
                "    'type': 'link'," +
                "    'name': 'Serlo'," +
                "    'href': 'https://de.serlo.org/mathe/funktionen/wichtige-funktionstypen-ihre-eigenschaften/lineare-funktionen-geraden/geradengleichung'" +
                "   }," +
                "   {" +
                "    'name': 'Kugel'," +
                "    'file': 'Kugel.png'," +
                "    'type': 'file'," +
                "    'tag': 'idea'," +
                "    'href': 'data/Mathematik/Grundwissen/Type%20System/Kugel.png'," +
                "    'mime': 'image/png'" +
                "   }" +
                "  ]";
        JsonArray array = couch.getGson().fromJson(json, JsonArray.class);

        couch.fixAttachments(array,"Meta", "Mathe", "Matik");
        System.out.println("array = " + array);
        /*
        couch.loadAttachment(attachment -> {
            if (attachment.responseCode == 200) {
                try {
                    IOUtils.copy(attachment.stream, System.out);
                } catch (IOException e) {
                    e.printStackTrace();
                }
                System.out.flush();
            }
        }, "Hilfe", "Hilfe", "Aktuelles", "ich.jpg");
         */

        //couch.walk("Mathematik");
        //JsonObject object = couch.chapter("mathe", "Mathematik");
        //System.out.println("object = " + object);
        //JsonObject states = couch.statesAndProgress("h.engels", "Mathematik");
        //System.out.println("states = " + states);
    }

    public JsonArray instances() {
        CouchDbClient client = createClient("lala");
        String uri = client.getBaseUri().toString();
        JsonArray result = client.findAny(JsonArray.class, uri + "/_all_dbs");
        List<String> list = new ArrayList<>();
        result.forEach(element -> {
            String name = element.getAsString();
            if (name.endsWith("-map"))
                list.add(name.substring(0, name.length() - "-map".length()));
        });
        JsonArray array = new JsonArray();
        list.forEach(name -> {
            JsonObject instance = new JsonObject();
            instance.addProperty("name", name);
            try {
                JsonObject meta = client.findAny(JsonObject.class, uri + "/" + name + "-map/meta");
                instance.addProperty("description", meta.get("description").getAsString());
            } catch (NoDocumentException ignored) {}
            array.add(instance);
        });
        return array;
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
