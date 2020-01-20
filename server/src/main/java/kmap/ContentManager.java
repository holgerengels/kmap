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
            JsonObject object = (JsonObject)element;
            object.remove("_id");
            object.remove("_rev");
        }

        JsonObject doc = new JsonObject();
        doc.addProperty("subject", subject);
        doc.addProperty("module", module);
        doc.add("docs", array);
        exportModuleDoc(out, doc);
        for (JsonElement element : array) {
            JsonObject object = (JsonObject)element;
            String chapter = object.get("chapter").getAsString();
            String topic  = object.get("topic").getAsString();
            List<String> added = new ArrayList<>();
            JsonArray attachments = object.getAsJsonArray("attachments");
            if (attachments != null) {
                for (JsonElement elefant : attachments) {
                    JsonObject attachment = (JsonObject) elefant;
                    if ("link".equals(attachment.getAsJsonPrimitive("type").getAsString()))
                        continue;

                    String name = attachment.get("name").getAsString();
                    exportFile(out, String.join("/", subject, chapter, topic, name));
                    added.add(name);
                }
            }
            List<Cloud.Attachment> attachmes = cloud.findAttachments(subject, chapter, topic, false);
            for (Cloud.Attachment attachment : attachmes) {
                if (added.contains(attachment.name))
                    continue;

                exportFile(out, String.join("/", subject, chapter, topic, attachment.name));
            }
        }
        out.close();
    }

    private void exportModuleDoc(ZipOutputStream out, JsonObject doc) throws IOException {
        ZipEntry entry = new ZipEntry("META/module.json");
        out.putNextEntry(entry);
        IOUtils.copy(new StringReader(doc.toString()), out);
        out.closeEntry();
    }

    void exportFile(ZipOutputStream out, String file) throws IOException {
        String[] dirs = file.split("/");
        cloud.loadAttachment(attachment -> {
            if (attachment.responseCode == 200) {
                try {
                    String fileName = dirs[dirs.length - 1];
                    System.out.println("fileName = " + fileName + " (" + attachment.contentLength + ")");
                    ZipEntry entry = new ZipEntry(file);
                    out.putNextEntry(entry);
                    IOUtils.copy(attachment.stream, out);
                    out.closeEntry();
                }
                catch (Exception e) {
                    e.printStackTrace();
                    throw new RuntimeException(e);
                }
            }
            else
                System.out.println("attachment = " + attachment.responseMessage);
        }, dirs);
    }

    String[] importModule(InputStream inputStream) throws IOException {
        String subject = null;
        String module = null;

        ZipInputStream in = new ZipInputStream(inputStream, StandardCharsets.UTF_8);

        Map<String,String> tags = new HashMap<>();

        ZipEntry zipEntry;
        while ((zipEntry = in.getNextEntry()) != null) {
            if ("META/module.json".equals(zipEntry.getName())) {
                String json = IOUtils.toString(new InputStreamReader(in, StandardCharsets.UTF_8));
                JsonObject object = couch.getGson().fromJson(json, JsonObject.class);
                subject = object.get("subject").getAsString();
                module = object.get("module").getAsString();

                JsonArray array = object.getAsJsonArray("docs");
                for (JsonElement element : array) {
                    JsonObject card = (JsonObject) element;
                    String chapter = card.get("chapter").getAsString();
                    String topic = card.get("topic").getAsString();
                    JsonArray attachments = card.getAsJsonArray("attachments");
                    if (attachments != null) {
                        for (JsonElement elefant : attachments) {
                            JsonObject attachment = (JsonObject) elefant;
                            if ("link".equals(attachment.getAsJsonPrimitive("type").getAsString()))
                                continue;

                            String name = attachment.get("name").getAsString();
                            String tag = attachment.get("tag").getAsString();
                            String path = Arrays.stream(new String[] {subject, chapter, topic, name}).map(Cloud::encode).collect(Collectors.joining("/"));
                            tags.put(path, "kmap-" + tag);
                        }
                    }
                }
                couch.importModule(subject, module, json);
            }
            else {
                int responseCode = cloud.storeAttachment(new KeepOpenInputStream(in), zipEntry.getName().split("/"));
                System.out.println(zipEntry.getName() + " " + responseCode);
            }
        }
        System.out.println("tags = " + tags);
        cloud.transferTags(tags);

        return new String[] { subject, module};
    }

    void exportSet(String subject, String set, OutputStream outputStream) throws IOException {
        ZipOutputStream out = new ZipOutputStream(outputStream, StandardCharsets.UTF_8);
        Set<String> added = new HashSet<>();

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
        exportSetDoc(out, doc);
        for (JsonElement element : array) {
            JsonObject object = (JsonObject)element;
            String chapter = object.get("chapter").getAsString();
            String topic  = object.get("topic").getAsString();
            String path = String.join("/", subject, chapter, topic);
            if (!added.contains(path)) {
                added.add(path);
                List<Cloud.Attachment> attachmes = cloud.findAttachments(subject, chapter, topic, true);
                for (Cloud.Attachment attachment : attachmes) {
                    exportFile(out, String.join("/", subject, chapter, topic, "tests", attachment.name));
                }
            }
        }
        out.close();
    }

    private void exportSetDoc(ZipOutputStream out, JsonObject doc) throws IOException {
        ZipEntry entry = new ZipEntry("META/set.json");
        out.putNextEntry(entry);
        IOUtils.copy(new StringReader(doc.toString()), out);
        out.closeEntry();
    }

    String[] importSet(InputStream inputStream) throws IOException {
        String subject = null;
        String set = null;

        ZipInputStream in = new ZipInputStream(inputStream, StandardCharsets.UTF_8);

        Map<String,String> tags = new HashMap<>();

        ZipEntry zipEntry;
        while ((zipEntry = in.getNextEntry()) != null) {
            if ("META/set.json".equals(zipEntry.getName())) {
                String json = IOUtils.toString(new InputStreamReader(in, StandardCharsets.UTF_8));
                JsonObject object = couch.getGson().fromJson(json, JsonObject.class);
                subject = object.get("subject").getAsString();
                set = object.get("set").getAsString();
                tests.importSet(subject, set, json);
            }
            else {
                int responseCode = cloud.storeAttachment(new KeepOpenInputStream(in), zipEntry.getName().split("/"));
                System.out.println(zipEntry.getName() + " " + responseCode);
            }
        }
        System.out.println("tags = " + tags);
        cloud.transferTags(tags);

        return new String[] { subject, set};
    }

    public static void main(String[] args) throws IOException {
        ContentManager manager = new ContentManager(readProperties(args[0]));
        CLIENT.set("vu");
        manager.exportSet("Mathematik", "Parabeln", Files.newOutputStream(Paths.get("/tmp/test.zip")));
        CLIENT.set("lala");
        manager.createInstance("lala");
        manager.importSet(Files.newInputStream(Paths.get("/tmp/test.zip")));
        //CLIENT.remove();
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
            String id = JSON.string(object, "id");
            String name = JSON.string(object, "name");

            HttpPut put;
            InputStreamEntity entity;

            put = new HttpPut(url() + id + "-map");
            try (CloseableHttpResponse ignored = httpClient.execute(put, context)){}
            put = new HttpPut(url() + id + "-test");
            try (CloseableHttpResponse ignored = httpClient.execute(put, context)){}
            put = new HttpPut(url() + id + "-state");
            try (CloseableHttpResponse ignored = httpClient.execute(put, context)){}

            put = new HttpPut(url() + id + "-map/_design/net");
            entity = new InputStreamEntity(Files.newInputStream(Paths.get(getProperty("kmap.designDocs") + "design-map.json")));
            entity.setContentType("application/json");
            put.setEntity(entity);
            try (CloseableHttpResponse ignored = httpClient.execute(put, context)){}

            put = new HttpPut(url() + id + "-test/_design/test");
            entity = new InputStreamEntity(Files.newInputStream(Paths.get(getProperty("kmap.designDocs") + "design-test.json")));
            entity.setContentType("application/json");
            put.setEntity(entity);
            try (CloseableHttpResponse ignored = httpClient.execute(put, context)){}

            JsonObject meta = new JsonObject();
            meta.addProperty("_id", "meta");
            meta.addProperty("name", name);
            client.save(meta);
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
