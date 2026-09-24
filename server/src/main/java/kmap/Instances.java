package kmap;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.model.Filters;
import com.mongodb.client.model.ReplaceOptions;
import org.bson.Document;

import java.io.StringReader;
import java.util.*;

import static kmap.JSON.string;

public class Instances extends Server {
    private static Instances INSTANCE;
    private final MongoConnection connection;

    public static synchronized Instances get(Properties properties) {
        if (INSTANCE == null) {
            INSTANCE = new Instances(properties);
        }
        return INSTANCE;
    }

    Instances(Properties properties) {
        super(properties);
        connection = new MongoConnection(properties);
    }

    public JsonArray instances() {
        JsonArray array = new JsonArray();
        MongoCollection<Document> cards = connection.getCollection("cards");
        Set<String> seen = new HashSet<>();
        for (Document doc : cards.find(Filters.eq("couch_id", "meta"))) {
            String name = doc.getString("instance");
            if (name != null) {
                seen.add(name);
                JsonObject instance = new JsonObject();
                instance.addProperty("name", name);
                instance.addProperty("description", doc.getString("description"));
                instance.addProperty("authconf", doc.getString("authconf"));
                array.add(instance);
            }
        }
        for (String name : cards.distinct("instance", String.class)) {
            if (name != null && !seen.contains(name)) {
                seen.add(name);
                JsonObject instance = new JsonObject();
                instance.addProperty("name", name);
                array.add(instance);
            }
        }
        return array;
    }

    synchronized void editInstance(String name, String json) {
        MongoCollection<Document> cards = connection.getCollection("cards");
        JsonObject object = MongoConnection.getGson().fromJson(json, JsonObject.class);
        String description = string(object, "description");
        String authconf = string(object, "authconf");

        Document doc = new Document("_id", name + ":meta")
                .append("instance", name)
                .append("couch_id", "meta")
                .append("description", description)
                .append("authconf", authconf);

        cards.replaceOne(Filters.eq("_id", name + ":meta"), doc, new ReplaceOptions().upsert(true));
        PaedMLConnection.kick();
    }

    Properties authconf() {
        try {
            MongoCollection<Document> cards = connection.getCollection("cards");
            String instance = connection.getInstance();
            Document meta = cards.find(Filters.and(
                Filters.eq("instance", instance),
                Filters.eq("couch_id", "meta")
            )).first();
            Properties props = new Properties();
            if (meta != null) {
                String authconf = meta.getString("authconf");
                if (authconf != null)
                    props.load(new StringReader(authconf));
            }
            return props;
        }
        catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    synchronized void createInstance(String json) {
        JsonObject object = MongoConnection.getGson().fromJson(json, JsonObject.class);
        String name = string(object, "name");
        String description = string(object, "description");
        String authconf = string(object, "authconf");

        MongoCollection<Document> cards = connection.getCollection("cards");
        Document doc = new Document("_id", name + ":meta")
                .append("instance", name)
                .append("couch_id", "meta")
                .append("description", description)
                .append("authconf", authconf);
        cards.replaceOne(Filters.eq("_id", name + ":meta"), doc, new ReplaceOptions().upsert(true));
        System.out.println("created instance " + name);
    }

    void dropInstance(String name) {
        String[] cols = { "cards", "tests", "courses", "states", "feedback", "users", "attachments" };
        for (String col : cols) {
            connection.getCollection(col).deleteMany(Filters.eq("instance", name));
            System.out.println("dropped instance " + name + " from " + col);
        }
    }
}
