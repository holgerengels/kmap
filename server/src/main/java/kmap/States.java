package kmap;

import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonPrimitive;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.model.Filters;
import org.bson.Document;

import java.io.FileInputStream;
import java.io.IOException;
import java.util.*;
import java.util.regex.Pattern;

/**
 * Created by holger on 04.04.17.
 * Refactored to MongoDB backend.
 */
public class States {
    private final Couch couch;
    private final MongoConnection connection;

    public States(Couch couch) {
        this.couch = couch;
        this.connection = couch.getConnection();
    }

    public Couch getCouch() {
        return couch;
    }

    private MongoCollection<Document> states() {
        return connection.getCollection("states");
    }

    private String instance() {
        return connection.getInstance();
    }

    public synchronized JsonObject states(String user, String subject) {
        String id = instance() + ":" + user + "." + subject;
        Document doc = states().find(Filters.eq("_id", id)).first();
        if (doc == null) {
            JsonObject states = new JsonObject();
            states.addProperty("_id", id);
            states.addProperty("instance", instance());
            states().insertOne(MongoConnection.toDocument(states));
            return states;
        }

        JsonObject states = MongoConnection.toJsonObject(doc);
        states.entrySet().stream()
                .filter(entry -> !"_id".equals(entry.getKey()) && !"_rev".equals(entry.getKey()) && !"instance".equals(entry.getKey()) && !"couch_id".equals(entry.getKey()))
                .forEach(entry -> {
                    JsonElement value = entry.getValue();
                    if (value.isJsonPrimitive() && value.getAsJsonPrimitive().isNumber() && value.getAsInt() == 5)
                        entry.setValue(new JsonPrimitive(4));
                    if (value.isJsonPrimitive() && value.getAsJsonPrimitive().isString())
                        entry.setValue(new JsonPrimitive(value.getAsNumber()));
                });
        return states;
    }

    public synchronized JsonObject statesAndProgress(String user, String subject) {
        JsonObject states = states(user, subject);
        states.remove("_id");
        states.remove("_rev");
        states.remove("instance");
        states.remove("couch_id");

        averageAndProgress(states, subject);

        states.entrySet().removeIf(entry -> entry.getValue().isJsonNull());
        return states;
    }

    void averageAndProgress(JsonObject states, String subject) {
        Map<String, String> links = couch.links(subject);
        Map<String, Integer> counts = couch.counts(subject);
        Map<String, Set<String>> aggregates = new HashMap<>();
        couch.aggregates(links, aggregates, subject);

        Map<String, Couch.WeightedSum> weightedSums = averages(states, counts, aggregates);
        for (Map.Entry<String, Couch.WeightedSum> entry : weightedSums.entrySet()) {
            String chapter = entry.getKey();
            Couch.WeightedSum weightedSum = entry.getValue();
            states.addProperty(chapter, Math.round(weightedSum.average()));
            states.addProperty(chapter + "*", weightedSum.getCount());
            states.addProperty(chapter + "#", weightedSum.getTarget());
        }
    }

    private Map<String, Couch.WeightedSum> averages(JsonObject states, Map<String, Integer> counts, Map<String, Set<String>> aggregates) {
        Map<String, Couch.WeightedSum> weightedSums = new HashMap<>();
        for (Map.Entry<String, Set<String>> entry : aggregates.entrySet()) {
            String chapter = entry.getKey();
            Couch.WeightedSum sum = weights(states, chapter);
            sum.target(counts.getOrDefault(chapter, 0));
            for (String aggregatedChapter : entry.getValue()) {
                Couch.WeightedSum aggregatedSum = weights(states, aggregatedChapter);
                sum.add(aggregatedSum);
                sum.target(counts.getOrDefault(aggregatedChapter, 0));
            }
            weightedSums.put(chapter, sum);
        }
        return weightedSums;
    }

    private Couch.WeightedSum weights(JsonObject states, String chapter) {
        Couch.WeightedSum sum = new Couch.WeightedSum();
        for (Map.Entry<String, JsonElement> entry : states.entrySet()) {
            if (entry.getKey().startsWith(chapter + ".") && !entry.getKey().endsWith("*") && !entry.getKey().endsWith("#")) {
                int value = entry.getValue().getAsInt();
                if (value != 0) {
                    sum.add(value);
                }
            }
        }
        return sum;
    }

    public synchronized JsonObject store(String user, String subject, String json) {
        JsonObject object = MongoConnection.getGson().fromJson(json, JsonObject.class);
        JsonObject states = states(user, subject);
        List<String> topics = couch.topicsAsList(subject);
        states.entrySet().removeIf(entry -> {
            String key = entry.getKey();
            JsonElement value = entry.getValue();
            return !"_id".equals(key) && !"_rev".equals(key) && !"instance".equals(key) && !"couch_id".equals(key)
                    && !topics.contains(key) || (value.getAsJsonPrimitive().isNumber() && value.getAsInt() == 0);
        });
        states.add(object.get("id").getAsString(), object.get("rate"));
        String id = instance() + ":" + user + "." + subject;
        states.addProperty("_id", id);
        states.addProperty("instance", instance());
        states().replaceOne(Filters.eq("_id", id), MongoConnection.toDocument(states));
        return statesAndProgress(user, subject);
    }

    public void delete(String user) {
        states().deleteMany(Filters.and(
            Filters.eq("instance", instance()),
            Filters.regex("_id", "^" + Pattern.quote(instance() + ":" + user + "."))
        ));
    }

    public static void main(String[] args) throws IOException {
        Server.CLIENT.set("root");
        States states = new States(new Couch(readProperties(args[0])));
        states.delete("h.engels");
    }

    private static Properties readProperties(String fileName) throws IOException {
        Properties properties = new Properties();
        properties.load(new FileInputStream(fileName));
        return properties;
    }
}
