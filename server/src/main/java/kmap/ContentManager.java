package kmap;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import org.apache.commons.io.IOUtils;
import org.apache.http.HttpHost;
import org.apache.http.auth.AuthScope;
import org.apache.http.auth.UsernamePasswordCredentials;
import org.apache.http.client.AuthCache;
import org.apache.http.client.CredentialsProvider;
import org.apache.http.client.methods.CloseableHttpResponse;
import org.apache.http.client.methods.HttpDelete;
import org.apache.http.client.methods.HttpPut;
import org.apache.http.client.protocol.HttpClientContext;
import org.apache.http.entity.InputStreamEntity;
import org.apache.http.impl.DefaultConnectionReuseStrategy;
import org.apache.http.impl.auth.BasicScheme;
import org.apache.http.impl.client.*;
import org.apache.http.impl.conn.BasicHttpClientConnectionManager;
import org.lightcouch.CouchDbClient;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.*;
import java.util.stream.Collectors;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;
import java.util.zip.ZipOutputStream;

import static kmap.JSON.string;

public class ContentManager extends Server
{
    Cloud cloud;
    Couch couch;
    Tests tests;

    public ContentManager(Properties properties) {
        super(properties);
        cloud = new Cloud(properties);
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
                    zipFile(out, String.join("/", subject, chapter, topic, file));
                    added.add(file);
                }
            }

            List<Cloud.Attachment> cloudAttachments = cloud.findAttachments(subject, chapter, topic, false);
            for (Cloud.Attachment attachment : cloudAttachments) {
                if (added.contains(attachment.name))
                    continue;

                zipFile(out, String.join("/", subject, chapter, topic, attachment.name));
            }
        }
        out.close();
    }

    private void zipModuleDoc(ZipOutputStream out, JsonObject doc) throws IOException {
        ZipEntry entry = new ZipEntry("META/module.json");
        out.putNextEntry(entry);
        OutputStreamWriter writer = new OutputStreamWriter(out, StandardCharsets.UTF_8);
        IOUtils.copy(new StringReader(doc.toString()), writer);
        out.closeEntry();
    }

    void zipFile(ZipOutputStream out, String file) throws IOException {
        String[] dirs = file.split("/");
        if (!tests.loadAttachment(attachment -> {
            doZipFile(dirs, attachment, out);
        }, dirs)) {
            cloud.loadAttachment(attachment -> {
                if (attachment.responseCode == 200) {
                    doZipFile(dirs, attachment, out);
                }
                else
                    System.out.println("ERROR: attachment " + file + ": " + attachment.responseMessage);
            }, dirs);
        }
    }

    private void doZipFile(String[] dirs, Cloud.AttachmentInputStream attachment, ZipOutputStream out) {
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
                idrev = couch.importAttachment(idrev, zipEntry.getName(), mime, new KeepOpenInputStream(in));
                idrevOrigin = dirs[1] + dirs[2];
            }
        }

        return new String[] { subject, module};
    }

    public static void main(String[] args) throws IOException {
        ContentManager manager = new ContentManager(readProperties(args[0]));
        /*
        CLIENT.set("vu");
        manager.exportSet("Mathematik", "Parabeln", Files.newOutputStream(Paths.get("/tmp/test.zip")));
        CLIENT.set("lala");
        manager.createInstance("lala");
        manager.importSet(Files.newInputStream(Paths.get("/tmp/test.zip")));
         */
        //CLIENT.remove();
        //manager.syncModule("vu", "root", "Hilfe", "Hilfe");
        //manager.syncModule("vu", "root", "Mathematik", "Grundwissen");
        manager.syncSet("vu", "root", "Mathematik", "Geraden");
        manager.syncModule("vu", "root", "Mathematik", "Analysis");
        manager.syncModule("vu", "root", "Mathematik", "Analysis Plus");
        manager.syncModule("vu", "root", "Mathematik", "Lineare Algebra");
        manager.syncModule("vu", "root", "Mathematik", "Stochastik");
    }

    void exportSet(String subject, String set, OutputStream outputStream) throws IOException {
        ZipOutputStream out = new ZipOutputStream(outputStream, StandardCharsets.UTF_8);

        JsonArray array = tests.loadSet(subject, set);
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
            Set<String> added = new HashSet<>();
            if (attachments != null) {
                for (String file : attachments.keySet()) {
                    zipFile(out, String.join("/", subject, set, key, file));
                    added.add(file);
                }
            }

            List<Cloud.Attachment> cloudAttachments = cloud.findAttachments(subject, chapter, topic, true);
            for (Cloud.Attachment attachment : cloudAttachments) {
                if (added.contains(attachment.name))
                    continue;

                if (!both.contains("inline:" + attachment.name))
                    continue;

                String zipPath = String.join("/", subject, set, key, attachment.name);
                String cloudPath = String.join("/", subject, chapter, topic, "tests", attachment.name);
                zipTestFile(out, zipPath, cloudPath);
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

    void zipTestFile(ZipOutputStream out, String zipPath, String cloudPath) throws IOException {
        String[] zipDirs = zipPath.split("/");
        String[] cloudDirs = cloudPath.split("/");
        if (!couch.loadAttachment(attachment -> {
            doZipFile(zipDirs, attachment, out);
        }, zipDirs)) {
            cloud.loadAttachment(attachment -> {
                if (attachment.responseCode == 200) {
                    doZipFile(zipDirs, attachment, out);
                } else
                    System.out.println("ERROR: attachment " + zipPath + ": " + attachment.responseMessage);
            }, cloudDirs);
        }
    }

    String[] importSet(InputStream inputStream) throws IOException {
        String subject = null;
        String set = null;

        Map<String, JsonObject> attachments = new HashMap<>();
        String[] idrev = null;
        String idrevOrigin = null;
        ZipInputStream in = new ZipInputStream(inputStream, StandardCharsets.UTF_8);
        ZipEntry zipEntry;
        while ((zipEntry = in.getNextEntry()) != null) {
            if ("META/set.json".equals(zipEntry.getName())) {
                String json = IOUtils.toString(new InputStreamReader(in, StandardCharsets.UTF_8));
                JsonObject object = couch.getGson().fromJson(json, JsonObject.class);
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
                String[] dirs = zipEntry.getName().split("/");
                if (!(dirs[1] + dirs[2]).equals(idrevOrigin))
                    idrev = null;
                String mime = MimeTypes.guessType(zipEntry.getName());
                idrev = tests.importTestAttachment(idrev, zipEntry.getName(), mime, new KeepOpenInputStream(in));
                idrevOrigin = dirs[1] + dirs[2];
            }
        }

        return new String[] { subject, set};
    }

    void syncModule(String fromInstance, String toInstance, String subject, String module) {
        String restoreInstance = Server.CLIENT.get();
        Server.CLIENT.set(fromInstance);
        JsonArray array = couch.loadModule(subject, module);
        for (JsonElement element : array) {
            JsonObject object = (JsonObject)element;
            object.remove("_id");
            object.remove("_rev");
        }
        JsonObject doc = new JsonObject();
        doc.addProperty("subject", subject);
        doc.addProperty("module", module);
        doc.add("docs", array);

        Server.CLIENT.set(toInstance);
        couch.importModule(subject, module, doc.toString());

        Set<String[]> dirs = new HashSet<>();
        for (JsonElement element : array) {
            JsonObject card = (JsonObject)element;
            String chapter = card.get("chapter").getAsString();
            String topic = card.get("topic").getAsString();
            dirs.add(new String[] {subject, chapter, topic});
        }

        for (String[] dir : dirs) {
            System.out.println(Arrays.asList(dir));
            Map<String, String> tags = new HashMap<>();

            Server.CLIENT.set(fromInstance);
            List<Cloud.Attachment> fromAttachments = cloud.findAttachments(dir[0], dir[1], dir[2], false);
            Server.CLIENT.set(toInstance);
            List<Cloud.Attachment> toAttachments = cloud.findAttachments(dir[0], dir[1], dir[2], false);

            List<Cloud.Attachment> added = new ArrayList<>(fromAttachments);
            added.removeAll(toAttachments);

            List<Cloud.Attachment> removed = new ArrayList<>(toAttachments);
            removed.removeAll(fromAttachments);

            List<Cloud.Attachment> kept = new ArrayList<>(toAttachments);
            kept.retainAll(fromAttachments);

            Map<Cloud.Attachment,Cloud.Attachment> changed = new HashMap<>();
            for (Cloud.Attachment attachment : kept) {
                int i = fromAttachments.indexOf(attachment);
                Cloud.Attachment master = fromAttachments.get(i);
                if (!Objects.equals(attachment.type, master.type))
                    changed.put(attachment, master);
                else if (!Objects.equals(attachment.tag, master.tag))
                    changed.put(attachment, master);
                else if (!Objects.equals(attachment.size, master.size))
                    changed.put(attachment, master);
            }

            if (fromAttachments.size() != 0) {
                Server.CLIENT.set(toInstance);
                cloud.createDirectory(dir);
            }

            for (Cloud.Attachment attachment : added) {
                String[] file = file(dir, attachment.name);
                System.out.println("copy added " + Arrays.toString(file));
                cloud.copy(fromInstance, toInstance, file);

                if (attachment.tag != null) {
                    String path = Arrays.stream(file).map(JsonServlet::encode).collect(Collectors.joining("/"));
                    tags.put(path, "kmap-" + attachment.tag);
                }
            }
            for (Cloud.Attachment attachment : removed) {
                String[] file = file(dir, attachment.name);
                System.out.println("delete " + Arrays.toString(file));
                cloud.delete(toInstance, file);
            }
            for (Map.Entry<Cloud.Attachment, Cloud.Attachment> entry : changed.entrySet()) {
                String[] file = file(dir, entry.getValue().name);
                System.out.println("copy changed " + Arrays.toString(file));
                cloud.copy(fromInstance, toInstance, file);

                if (entry.getValue().tag != null) {
                    String path = Arrays.stream(file).map(JsonServlet::encode).collect(Collectors.joining("/"));
                    tags.put(path, "kmap-" + entry.getValue().tag);
                }
            }

            if (tags.size() > 0) {
                System.out.println("tags = " + tags);
                Server.CLIENT.set(toInstance);
                cloud.transferTags(tags);
            }
            try {
                Thread.sleep(2000);
            }
            catch (InterruptedException e) {
                e.printStackTrace();
            }
        }

        Server.CLIENT.set(restoreInstance);
    }

    void syncSet(String fromInstance, String toInstance, String subject, String set) {
        String restoreInstance = Server.CLIENT.get();
        Server.CLIENT.set(fromInstance);
        JsonArray array = tests.loadSet(subject, set);
        for (JsonElement element : array) {
            JsonObject object = (JsonObject)element;
            object.remove("_id");
            object.remove("_rev");
        }
        JsonObject doc = new JsonObject();
        doc.addProperty("subject", subject);
        doc.addProperty("set", set);
        doc.add("docs", array);

        Server.CLIENT.set(toInstance);
        tests.importSet(subject, set, doc.toString());

        Set<String[]> dirs = new HashSet<>();
        for (JsonElement element : array) {
            JsonObject card = (JsonObject)element;
            String chapter = card.get("chapter").getAsString();
            String topic = card.get("topic").getAsString();
            dirs.add(new String[] {subject, chapter, topic});
        }

        for (String[] dir : dirs) {
            System.out.println(Arrays.asList(dir));

            Server.CLIENT.set(fromInstance);
            List<Cloud.Attachment> fromAttachments = cloud.findAttachments(dir[0], dir[1], dir[2], true);
            Server.CLIENT.set(toInstance);
            List<Cloud.Attachment> toAttachments = cloud.findAttachments(dir[0], dir[1], dir[2], true);

            List<Cloud.Attachment> added = new ArrayList<>(fromAttachments);
            added.removeAll(toAttachments);

            List<Cloud.Attachment> removed = new ArrayList<>(toAttachments);
            removed.removeAll(fromAttachments);

            List<Cloud.Attachment> kept = new ArrayList<>(toAttachments);
            kept.retainAll(fromAttachments);

            Map<Cloud.Attachment,Cloud.Attachment> changed = new HashMap<>();
            for (Cloud.Attachment attachment : kept) {
                int i = fromAttachments.indexOf(attachment);
                Cloud.Attachment master = fromAttachments.get(i);
                if (!Objects.equals(attachment.type, master.type))
                    changed.put(attachment, master);
                else if (!Objects.equals(attachment.size, master.size))
                    changed.put(attachment, master);
            }

            if (fromAttachments.size() != 0) {
                Server.CLIENT.set(toInstance);
                String[] file = file(dir, "tests");
                cloud.createDirectory(file);
            }

            for (Cloud.Attachment attachment : added) {
                String[] file = file(dir, "tests", attachment.name);
                System.out.println("copy added " + Arrays.toString(file));
                cloud.copy(fromInstance, toInstance, file);
            }
            for (Cloud.Attachment attachment : removed) {
                String[] file = file(dir, "tests", attachment.name);
                System.out.println("delete " + Arrays.toString(file));
                cloud.delete(toInstance, file);
            }
            for (Map.Entry<Cloud.Attachment, Cloud.Attachment> entry : changed.entrySet()) {
                String[] file = file(dir, "tests", entry.getValue().name);
                System.out.println("copy changed " + Arrays.toString(file));
                cloud.copy(fromInstance, toInstance, file);
            }

            try {
                Thread.sleep(2000);
            }
            catch (InterruptedException e) {
                e.printStackTrace();
            }
        }

        Server.CLIENT.set(restoreInstance);
    }

    public JsonArray instances() {
        return couch.instances();
    }

    /*
curl -X PUT -u $1 http://localhost:5984/$2-map
curl -X PUT -u $1 http://localhost:5984/$2-test
curl -X PUT -u $1 http://localhost:5984/$2-state

curl -X PUT -u $1 http://localhost:5984/$2-map/_design/net -d @design-map.json
curl -X PUT -u $1 http://localhost:5984/$2-test/_design/test -d @design-test.json
     */
    synchronized void createInstance(String json) {
        try {
            CloseableHttpClient httpClient = client();
            HttpClientContext context = clientContext();

            CouchDbClient client = couch.createClient("map");
            JsonObject object = client.getGson().fromJson(json, JsonObject.class);
            String name = string(object, "name");
            String description = string(object, "description");

            HttpPut put;
            InputStreamEntity entity;

            put = new HttpPut(url() + name + "-map");
            try (CloseableHttpResponse ignored = httpClient.execute(put, context)){}
            put = new HttpPut(url() + name + "-test");
            try (CloseableHttpResponse ignored = httpClient.execute(put, context)){}
            put = new HttpPut(url() + name + "-state");
            try (CloseableHttpResponse ignored = httpClient.execute(put, context)){}
            put = new HttpPut(url() + name + "-feedback");
            try (CloseableHttpResponse ignored = httpClient.execute(put, context)){}

            put = new HttpPut(url() + name + "-map/_design/net");
            entity = new InputStreamEntity(Files.newInputStream(Paths.get(getProperty("kmap.designDocs") + "design-map.json")));
            entity.setContentType("application/json");
            put.setEntity(entity);
            try (CloseableHttpResponse ignored = httpClient.execute(put, context)){}

            put = new HttpPut(url() + name + "-test/_design/test");
            entity = new InputStreamEntity(Files.newInputStream(Paths.get(getProperty("kmap.designDocs") + "design-test.json")));
            entity.setContentType("application/json");
            put.setEntity(entity);
            try (CloseableHttpResponse ignored = httpClient.execute(put, context)){}

            String current = Server.CLIENT.get();
            try {
                Server.CLIENT.set(name);
                CouchDbClient tempClient = couch.createClient("map");
                JsonObject meta = new JsonObject();
                meta.addProperty("_id", "meta");
                meta.addProperty("description", description);
                tempClient.save(meta);
            }
            finally {
                Server.CLIENT.set(current);
            }
        }
        catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    private String url() {
        return "http://" + getProperty("kmap.host") + ":" + getProperty("kmap.port") + "/";
    }

    /*
curl -X DELETE -u $1 http://127.0.0.1:5984/$2-map
curl -X DELETE -u $1 http://127.0.0.1:5984/$2-test
curl -X DELETE -u $1 http://127.0.0.1:5984/$2-state
     */
    void dropInstance(String name) {
        try {
            CloseableHttpClient client = client();
            HttpClientContext context = clientContext();

            HttpDelete put;
            InputStreamEntity entity;

            put = new HttpDelete(url() + name + "-map");
            try (CloseableHttpResponse ignored = client.execute(put, context)){}
            put = new HttpDelete(url() + name + "-test");
            try (CloseableHttpResponse ignored = client.execute(put, context)){}
            put = new HttpDelete(url() + name + "-state");
            try (CloseableHttpResponse ignored = client.execute(put, context)){}
        }
        catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    private String[] file(String[] dir, String... append) {
        String[] file = new String[3 + append.length];
        System.arraycopy(dir, 0, file, 0, 3);
        System.arraycopy(append, 0, file, 3, append.length);
        return file;
    }

    private HttpClientContext clientContext() {
        HttpHost targetHost = new HttpHost(getProperty("kmap.host"), Integer.parseInt(getProperty("kmap.port")), "http");
        CredentialsProvider credsProvider = new BasicCredentialsProvider();
        credsProvider.setCredentials(new AuthScope(targetHost.getHostName(), targetHost.getPort()), new UsernamePasswordCredentials(getProperty("kmap.user"), getProperty("kmap.password")));
        AuthCache authCache = new BasicAuthCache();
        BasicScheme basicAuth = new BasicScheme();
        authCache.put(targetHost, basicAuth);
        HttpClientContext context = HttpClientContext.create();
        context.setCredentialsProvider(credsProvider);
        context.setAuthCache(authCache);
        return context;
    }

    private CloseableHttpClient client() {
        BasicHttpClientConnectionManager connectionManager = new BasicHttpClientConnectionManager();
        return HttpClientBuilder.create()
                .setKeepAliveStrategy(DefaultConnectionKeepAliveStrategy.INSTANCE)
                .setConnectionReuseStrategy(DefaultConnectionReuseStrategy.INSTANCE)
                .setConnectionManager(connectionManager).build();
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
