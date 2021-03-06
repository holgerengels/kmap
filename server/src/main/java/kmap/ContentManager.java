package kmap;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import org.apache.commons.io.IOUtils;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;
import java.util.zip.ZipOutputStream;

import static kmap.JSON.string;

public class ContentManager extends Server
{
    Couch couch;
    Tests tests;

    public ContentManager(Properties properties) {
        super(properties);
        couch = new Couch(properties);
        tests = new Tests(couch);
    }

    void exportModule(String subject, String module, OutputStream outputStream) throws IOException {
        ZipOutputStream out = new ZipOutputStream(outputStream, StandardCharsets.UTF_8);

        JsonArray array = couch.loadModule(subject, module);
        for (JsonElement element : array) {
            JsonObject object = (JsonObject) element;
            object.remove("_id");
            object.remove("_rev");
            object.remove("_attachments");
        }

        JsonObject doc = new JsonObject();
        doc.addProperty("subject", subject);
        doc.addProperty("module", module);
        doc.add("docs", array);
        zipModuleDoc(out, doc);
        for (JsonElement element : array) {
            JsonObject object = (JsonObject)element;
            String chapter = object.get("chapter").getAsString();
            String topic  = object.get("topic").getAsString();
            JsonArray attachments = object.getAsJsonArray("attachments");
            Set<String> added = new HashSet<>();
            if (attachments != null) {
                for (JsonElement elefant : attachments) {
                    JsonObject attachment = (JsonObject)elefant;
                    if ("link".equals(attachment.getAsJsonPrimitive("type").getAsString()))
                        continue;

                    String file = attachment.get("file").getAsString();
                    zipFile(out, new String[] { subject, chapter, topic, file });
                    added.add(file);
                }
            }
        }
        out.close();
    }

    private void zipModuleDoc(ZipOutputStream out, JsonObject doc) throws IOException {
        ZipEntry entry = new ZipEntry("META/module.json");
        out.putNextEntry(entry);
        OutputStreamWriter writer = new OutputStreamWriter(out, StandardCharsets.UTF_8);
        IOUtils.copy(new StringReader(doc.toString()), writer);
        writer.flush();
        out.closeEntry();
    }

    void zipFile(ZipOutputStream out, String[] dirs) throws IOException {
        couch.loadAttachment(attachment -> {
            doZipFile(dirs, attachment, out);
        }, dirs);
    }

    private void doZipFile(String[] dirs, AttachmentInputStream attachment, ZipOutputStream out) {
        try {
            String fileName = dirs[dirs.length - 1];
            System.out.println("fileName = " + fileName + " (" + attachment.contentLength + ")");
            ZipEntry entry = new ZipEntry(String.join("/", dirs));
            out.putNextEntry(entry);
            IOUtils.copy(attachment.stream, out);
            out.closeEntry();
        }
        catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException(e);
        }
    }

    String[] importModule(InputStream inputStream) throws IOException {
        String subject = null;
        String module = null;

        Map<String, JsonObject> attachments = new HashMap<>();
        Map<String, List<JsonObject>> fixes = new HashMap<>();
        String[] idrev = null;
        String idrevOrigin = null;
        ZipInputStream in = new ZipInputStream(inputStream, StandardCharsets.UTF_8);
        ZipEntry zipEntry;
        while ((zipEntry = in.getNextEntry()) != null) {
            if ("META/module.json".equals(zipEntry.getName())) {
                String json = IOUtils.toString(new InputStreamReader(in, StandardCharsets.UTF_8));
                JsonObject object = couch.getGson().fromJson(json, JsonObject.class);
                subject = string(object, "subject");
                module = string(object, "module");
                JsonArray docs = object.getAsJsonArray("docs");
                for (JsonElement doc : docs) {
                    JsonObject topicObject = (JsonObject)doc;
                    String chapter = string(topicObject, "chapter");
                    String topic = string(topicObject, "topic");
                    JsonArray array = topicObject.getAsJsonArray("attachments");
                    couch.fixAttachments(array, subject, chapter, topic);
                    if (array != null) {
                        for (JsonElement element : array) {
                            JsonObject attachment = (JsonObject)element;
                            String type = string(attachment, "type");
                            if ("link".equals(type))
                                continue;
                            String file = string(attachment, "file");
                            attachments.put(String.join("/", subject, chapter, topic, file), attachment);
                        }
                    }
                }
                couch.importModule(subject, module, object.toString());
            }
            else {
                String[] dirs = zipEntry.getName().split("/");
                if (!(dirs[1] + dirs[2]).equals(idrevOrigin))
                    idrev = null;
                JsonObject attachment = attachments.get(zipEntry.getName());
                String mime = attachment != null ? string(attachment, "mime") : MimeTypes.guessType(zipEntry.getName());
                if (attachment == null) {
                    attachment = couch.attachmentFromAttachment(dirs[3], mime);
                    fixes.computeIfAbsent(String.join("/", Arrays.copyOfRange(dirs, 0, 3)), a -> new ArrayList<>()).add(attachment);
                }
                idrev = couch.importAttachment(idrev, zipEntry.getName(), mime, new KeepOpenInputStream(in));
                idrevOrigin = dirs[1] + dirs[2];
            }
        }

        fixes.forEach((key, value) -> couch.fix(key, value));

        return new String[] { subject, module};
    }

    public static void main(String[] args) throws IOException {
        ContentManager manager = new ContentManager(readProperties(args[0]));
        String from = "lolo";
        String to = "lala";
        manager.syncModule(from, to, "Mathematik", "Grundwissen");
        manager.syncModule(from, to, "Mathematik", "Analysis");
        manager.syncModule(from, to, "Mathematik", "Analysis Plus");
        manager.syncModule(from, to, "Mathematik", "Lineare Algebra");
        manager.syncModule(from, to, "Mathematik", "Stochastik");
        manager.syncModule(from, to, "Physik", "Eingangsklasse");
        manager.syncSet(from, to, "Mathematik", "Grundwissen");
        manager.syncSet(from, to, "Mathematik", "Terme");
        manager.syncSet(from, to, "Mathematik", "Gleichungen");
        manager.syncSet(from, to, "Mathematik", "Geraden");
        manager.syncSet(from, to, "Mathematik", "Parabeln");
        manager.syncSet(from, to, "Mathematik", "Funktionen");
        manager.syncSet(from, to, "Mathematik", "Quadratische Funktionen");
        manager.syncSet(from, to, "Mathematik", "Ganzrationale Funktionen");
        manager.syncSet(from, to, "Mathematik", "Exponentialfunktionen");
        manager.syncSet(from, to, "Mathematik", "Trigonometrische Funktionen");
    }

    void exportSet(String subject, String set, OutputStream outputStream) throws IOException {
        ZipOutputStream out = new ZipOutputStream(outputStream, StandardCharsets.UTF_8);

        JsonArray array = tests.loadTestsBySet(subject, set);
        for (JsonElement element : array) {
            JsonObject object = (JsonObject)element;
            object.remove("_id");
            object.remove("_rev");
        }

        JsonObject doc = new JsonObject();
        doc.addProperty("subject", subject);
        doc.addProperty("set", set);
        doc.add("docs", array);
        zipSetDoc(out, doc);
        for (JsonElement element : array) {
            JsonObject object = (JsonObject)element;
            String chapter = string(object, "chapter");
            String topic  = string(object, "topic");
            String key = string(object, "key");
            String question = string(object, "question");
            String answer = string(object, "answer");
            String both = question + "\n---\n" + answer;
            JsonObject attachments = object.getAsJsonObject("_attachments");
            if (attachments != null) {
                for (String file : attachments.keySet()) {
                    zipTestFile(out, new String[] { subject, set, key, file });
                }
            }
        }
        out.close();
    }

    private void zipSetDoc(ZipOutputStream out, JsonObject doc) throws IOException {
        ZipEntry entry = new ZipEntry("META/set.json");
        out.putNextEntry(entry);
        OutputStreamWriter writer = new OutputStreamWriter(out, StandardCharsets.UTF_8);
        IOUtils.copy(new StringReader(doc.toString()), writer);
        writer.flush();
        out.closeEntry();
    }

    void zipTestFile(ZipOutputStream out, String[] dirs) throws IOException {
        tests.loadAttachment(attachment -> {
            doZipFile(dirs, attachment, out);
        }, dirs);
    }

    String[] importSet(InputStream inputStream) throws IOException {
        String subject = null;
        String set = null;

        JsonObject object = null;
        String[] idrev = null;
        String idrevOrigin = null;
        ZipInputStream in = new ZipInputStream(inputStream, StandardCharsets.UTF_8);
        ZipEntry zipEntry;
        while ((zipEntry = in.getNextEntry()) != null) {
            if ("META/set.json".equals(zipEntry.getName())) {
                String json = IOUtils.toString(new InputStreamReader(in, StandardCharsets.UTF_8));
                object = couch.getGson().fromJson(json, JsonObject.class);
                subject = string(object, "subject");
                set = string(object, "set");
                JsonArray array = object.getAsJsonArray("docs");
                for (JsonElement element : array) {
                    JsonObject doc = (JsonObject)element;
                    doc.remove("_id");
                    doc.remove("_rev");
                    doc.remove("_attachments");
                }
                tests.importSet(subject, set, object.toString());
            }
            else {
                String path = zipEntry.getName();
                String[] dirs = path.split("/");
                if (dirs.length == 5 && "tests".equals(dirs[3])) {
                    String key = findKey(object, path);
                    if (key == null) {
                        System.out.println("no key for " + path);
                        continue;
                    }
                    dirs = new String[] { subject, set, key, dirs[4]};
                    path = String.join("/", dirs);
                }
                if (!(dirs[1] + dirs[2]).equals(idrevOrigin))
                    idrev = null;
                String mime = MimeTypes.guessType(path);
                idrev = tests.importTestAttachment(idrev, path, mime, new KeepOpenInputStream(in));
                idrevOrigin = dirs[1] + dirs[2];
            }
        }

        return new String[] { subject, set};
    }

    private String findKey(JsonObject object, String path) {
        String[] dirs = path.split("/");
        JsonArray array = object.getAsJsonArray("docs");
        for (JsonElement element : array) {
            JsonObject doc = (JsonObject)element;
            String chapter = string(doc, "chapter");
            String topic = string(doc, "topic");
            String question = string(doc, "question");
            String answer = string(doc, "answer");
            if (dirs[1].equals(chapter) && dirs[2].equals(topic)
                    && (question.contains("inline:" + dirs[4]) || answer.contains("inline:" + dirs[4])))
                return string(doc, "key");
        }
        return null;
    }

    void syncModule(String fromInstance, String toInstance, String subject, String module) {
        String restoreInstance = Server.CLIENT.get();
        Server.CLIENT.set(fromInstance);
        try {
            Server.CLIENT.set(fromInstance);
            File zip = File.createTempFile(subject + "-" + module, "zip");
            exportModule(subject, module, new FileOutputStream(zip));
            Server.CLIENT.set(toInstance);
            importModule(new FileInputStream(zip));
            Server.CLIENT.set(restoreInstance);
        }
        catch (IOException e) {
            e.printStackTrace();
        }
    }

    /*
    void migrateModule(String instance, String subject, String module) {
        String restoreInstance = Server.CLIENT.get();
        Server.CLIENT.set(instance);
        JsonArray array = couch.loadModule(subject, module);
        for (JsonElement element : array) {
            JsonObject object = (JsonObject)element;
        }
        Server.CLIENT.set(restoreInstance);
    }
     */

    void syncSet(String fromInstance, String toInstance, String subject, String set) {
        String restoreInstance = Server.CLIENT.get();
        Server.CLIENT.set(fromInstance);
        try {
            Server.CLIENT.set(fromInstance);
            File zip = File.createTempFile(subject + "-" + set + "-tests", "zip");
            exportSet(subject, set, new FileOutputStream(zip));
            Server.CLIENT.set(toInstance);
            importSet(new FileInputStream(zip));
            Server.CLIENT.set(restoreInstance);
        }
        catch (IOException e) {
            e.printStackTrace();
        }
    }

    private String[] file(String[] dir, String... append) {
        String[] file = new String[3 + append.length];
        System.arraycopy(dir, 0, file, 0, 3);
        System.arraycopy(append, 0, file, 3, append.length);
        return file;
    }

    public void syncInstance(String json) {
        JsonObject object = couch.getGson().fromJson(json, JsonObject.class);
        String from = string(object, "from");
        String to = string(object, "to");
        System.out.println("sync from " + from + " to " + to);
        Server.CLIENT.set(from);
        JsonArray array = couch.loadModules();
        for (JsonElement element : array) {
            String subject = string((JsonObject)element, "subject");
            String module = string((JsonObject)element, "module");
            System.out.println("sync module " + subject + " " + module);
            syncModule(from, to, subject, module);
        }
        Server.CLIENT.set(from);
        array = tests.loadSets();
        for (JsonElement element : array) {
            String subject = string((JsonObject)element, "subject");
            String set = string((JsonObject)element, "set");
            System.out.println("sync set " + subject + " " + set);
            syncSet(from, to, subject, set);
        }
    }

    public JsonObject deleteModule(String subject, String module) {
        return couch.deleteModule(subject, module);
    }

    public int batchCards(String json) {
        return couch.batchCards(json);
    }

    private static class KeepOpenInputStream extends InputStream {
        private InputStream in;

        KeepOpenInputStream(InputStream in) {
            this.in = in;
        }

        @Override
        public int read() throws IOException {
            return in.read();
        }

        public void close() {
        }
    }
}
