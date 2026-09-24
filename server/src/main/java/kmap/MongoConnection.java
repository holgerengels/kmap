package kmap;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.mongodb.ConnectionString;
import com.mongodb.MongoClientSettings;
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import org.bson.Document;
import org.bson.json.JsonMode;
import org.bson.json.JsonWriterSettings;

import java.util.Properties;
import java.util.concurrent.TimeUnit;

public class MongoConnection {
    private static volatile MongoClient mongoClient;
    private final Properties properties;
    private final String dbName;
    private static final Gson GSON = new Gson();
    private static final JsonWriterSettings JSON_SETTINGS = JsonWriterSettings.builder()
            .outputMode(JsonMode.RELAXED)
            .build();

    public MongoConnection(Properties properties) {
        this.properties = properties;
        this.dbName = getProperty("kmap.mongo.db", "kmap");
        initClient();
    }

    private void initClient() {
        if (mongoClient == null) {
            synchronized (MongoConnection.class) {
                if (mongoClient == null) {
                    String uri = System.getenv("MONGO_URI");
                    if (uri == null || uri.trim().isEmpty()) {
                        uri = properties != null ? properties.getProperty("kmap.mongo.uri") : null;
                    }
                    if (uri == null || uri.trim().isEmpty()) {
                        String host = System.getenv("MONGO_HOST");
                        if (host == null || host.trim().isEmpty()) {
                            host = getProperty("kmap.mongo.host", "localhost");
                        }
                        int port = Integer.parseInt(getProperty("kmap.mongo.port", "27017"));
                        String user = getProperty("kmap.mongo.user", "admin");
                        String pass = getProperty("kmap.mongo.password", "password");
                        if (user != null && pass != null && !user.isEmpty()) {
                            uri = "mongodb://" + user + ":" + pass + "@" + host + ":" + port + "/?authSource=admin";
                        } else {
                            uri = "mongodb://" + host + ":" + port;
                        }
                    }

                    MongoClientSettings settings = MongoClientSettings.builder()
                            .applyConnectionString(new ConnectionString(uri))
                            .applyToConnectionPoolSettings(builder ->
                                    builder.maxSize(50)
                                           .minSize(5)
                                           .maxWaitTime(5, TimeUnit.SECONDS))
                            .build();

                    mongoClient = MongoClients.create(settings);
                    System.out.println("MongoConnection initialized for " + uri + " (db: " + dbName + ")");
                }
            }
        }
    }

    public MongoDatabase getDatabase() {
        return mongoClient.getDatabase(dbName);
    }

    public MongoCollection<Document> getCollection(String name) {
        return getDatabase().getCollection(name);
    }

    public String getInstance() {
        String client = Server.CLIENT.get();
        return (client != null && !client.isEmpty()) ? client : "root";
    }

    public static Gson getGson() {
        return GSON;
    }

    public static JsonObject toJsonObject(Document doc) {
        if (doc == null) return null;
        return JsonParser.parseString(doc.toJson(JSON_SETTINGS)).getAsJsonObject();
    }

    public static Document toDocument(JsonObject obj) {
        if (obj == null) return null;
        return Document.parse(obj.toString());
    }

    private String getProperty(String key, String def) {
        return properties != null ? properties.getProperty(key, def) : def;
    }

    public static void close() {
        if (mongoClient != null) {
            synchronized (MongoConnection.class) {
                if (mongoClient != null) {
                    mongoClient.close();
                    mongoClient = null;
                }
            }
        }
    }
}
