package kmap;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
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
import org.lightcouch.NoDocumentException;

import java.io.IOException;
import java.io.StringReader;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.Properties;

import static kmap.JSON.string;

public class Instances
    extends Server
{
    private static Instances INSTANCE;
    private final CouchConnection connection;

    public static synchronized Instances get(Properties properties) {
        if (INSTANCE == null) {
            INSTANCE = new Instances(properties);
        }
        return INSTANCE;
    }

    Instances(Properties properties) {
        super(properties);
        connection = new CouchConnection(properties);
    }

    public JsonArray instances() {
        CouchDbClient client = connection.createClient("lala");
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
                instance.addProperty("description", string(meta, "description"));
                instance.addProperty("authconf", string(meta, "authconf"));
            } catch (NoDocumentException ignored) {}
            array.add(instance);
        });
        return array;
    }

    synchronized void editInstance(String name, String json) {
        String current = Server.CLIENT.get();
        try {
            Server.CLIENT.set(name);
            CouchDbClient tempClient = connection.createClient("map");
            JsonObject object = tempClient.getGson().fromJson(json, JsonObject.class);
            String description = string(object, "description");
            String authconf = string(object, "authconf");

            JsonObject meta = tempClient.find(JsonObject.class, "meta");
            meta.addProperty("description", description);
            meta.addProperty("authconf", authconf);
            tempClient.update(meta);
            PaedMLConnection.kick();
        }
        finally {
            Server.CLIENT.set(current);
        }
    }

    Properties authconf() {
        try {
            CouchDbClient client = connection.createClient("map");
            JsonObject meta = client.find(JsonObject.class, "meta");
            String authconf = JSON.string(meta, "authconf");
            Properties properties = new Properties();
            if (authconf != null)
                properties.load(new StringReader(authconf));
            return properties;
        }
        catch (Exception e) {
            throw new RuntimeException(e);
        }
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

            CouchDbClient client = connection.createClient("map");
            JsonObject object = client.getGson().fromJson(json, JsonObject.class);
            String name = string(object, "name");
            String description = string(object, "description");
            String authconf = string(object, "authconf");

            HttpPut put;
            InputStreamEntity entity;

            put = new HttpPut(url() + name + "-map");
            try (CloseableHttpResponse ignored = httpClient.execute(put, context)){ System.out.println("created " + name + "-map"); }
            put = new HttpPut(url() + name + "-test");
            try (CloseableHttpResponse ignored = httpClient.execute(put, context)){ System.out.println("created " + name + "-test"); }
            put = new HttpPut(url() + name + "-state");
            try (CloseableHttpResponse ignored = httpClient.execute(put, context)){ System.out.println("created " + name + "-state"); }
            put = new HttpPut(url() + name + "-feedback");
            try (CloseableHttpResponse ignored = httpClient.execute(put, context)){ System.out.println("created " + name + "-feedback"); }

            put = new HttpPut(url() + name + "-map/_design/net");
            entity = new InputStreamEntity(Files.newInputStream(Paths.get(getProperty("kmap.designDocs") + "design-map.json")));
            entity.setContentType("application/json");
            put.setEntity(entity);
            try (CloseableHttpResponse ignored = httpClient.execute(put, context)){ System.out.println("design " + name + "-map"); }

            put = new HttpPut(url() + name + "-test/_design/test");
            entity = new InputStreamEntity(Files.newInputStream(Paths.get(getProperty("kmap.designDocs") + "design-test.json")));
            entity.setContentType("application/json");
            put.setEntity(entity);
            try (CloseableHttpResponse ignored = httpClient.execute(put, context)){ System.out.println("design " + name + "-test"); }

            String current = Server.CLIENT.get();
            try {
                Server.CLIENT.set(name);
                CouchDbClient tempClient = connection.createClient("map");
                JsonObject meta = new JsonObject();
                meta.addProperty("_id", "meta");
                meta.addProperty("description", description);
                meta.addProperty("authconf", authconf);
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
            try (CloseableHttpResponse ignored = client.execute(put, context)){ System.out.println("dropped " + name + "-map"); }
            put = new HttpDelete(url() + name + "-test");
            try (CloseableHttpResponse ignored = client.execute(put, context)){ System.out.println("dropped " + name + "-test"); }
            put = new HttpDelete(url() + name + "-state");
            try (CloseableHttpResponse ignored = client.execute(put, context)){ System.out.println("dropped " + name + "-state"); }
            put = new HttpDelete(url() + name + "-feedback");
            try (CloseableHttpResponse ignored = client.execute(put, context)){ System.out.println("dropped " + name + "-feedback"); }
        }
        catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    private CloseableHttpClient client() {
        BasicHttpClientConnectionManager connectionManager = new BasicHttpClientConnectionManager();
        return HttpClientBuilder.create()
                .setKeepAliveStrategy(DefaultConnectionKeepAliveStrategy.INSTANCE)
                .setConnectionReuseStrategy(DefaultConnectionReuseStrategy.INSTANCE)
                .setConnectionManager(connectionManager).build();
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
}
