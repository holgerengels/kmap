package kmap;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonPrimitive;
import org.lightcouch.*;

import java.io.FileInputStream;
import java.io.IOException;
import java.util.*;

import static kmap.JSON.string;

/**
 * Created by holger on 04.04.17.
 */
public class States {
    private Couch couch;

    public States(Couch couch) {
        this.couch = couch;
    }

    public Couch getCouch() {
        return couch;
    }

    public synchronized JsonObject states(String user, String subject) {
        CouchDbClient client = getClient();
        try {
            JsonObject states = client.find(JsonObject.class, user + "." + subject);
            states.entrySet().forEach(entry -> {
                JsonElement value = entry.getValue();
                if (value.isJsonPrimitive() && value.getAsJsonPrimitive().isNumber() && value.getAsInt() == 5)
                    entry.setValue(new JsonPrimitive(4));
            });
            return states;
        }
        catch (NoDocumentException e) {
            JsonObject states = new JsonObject();
            states.addProperty("_id", user + "." + subject);
            client.save(states);
            return client.find(JsonObject.class, user + "." + subject);
        }
    }

    private CouchDbClient getClient() {
        return couch.createClient("state");
    }

    public synchronized JsonObject statesAndProgress(String user, String subject) {
        JsonObject states = states(user, subject);
        states.remove("_id");
        states.remove("_rev");

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
            System.out.println(chapter + " ... " + entry.getValue());
            Couch.WeightedSum sum = weights(states, chapter);
            sum.target(counts.getOrDefault(chapter, 0));
            for (String aggregatedChapter : entry.getValue()) {
                Couch.WeightedSum aggregatedSum = weights(states, aggregatedChapter);
                sum.add(aggregatedSum);
                sum.target(counts.getOrDefault(aggregatedChapter, 0));
            }
            //System.out.println(chapter + ": average = " + sum.getSum() + " / " + sum.getCount() + " = " + sum.average() + " of " + sum.getTarget());
            weightedSums.put(chapter, sum);
        }
        return weightedSums;
    }

    private Couch.WeightedSum weights(JsonObject states, String chapter) {
        Couch.WeightedSum sum = new Couch.WeightedSum();
        for (Map.Entry<String, JsonElement> entry : states.entrySet()) {
            if (entry.getKey().startsWith(chapter + ".") && !entry.getKey().endsWith("*")) {
                int value = entry.getValue().getAsInt();
                if (value != 0) {
                    sum.add(value);
                    //System.out.println("   " + chapter + ": " + entry.getKey() + " = " + value);
                }
            }
        }
        return sum;
    }


    public synchronized JsonObject store(String user, String subject, String json) {
        CouchDbClient client = getClient();
        JsonObject object = client.getGson().fromJson(json, JsonObject.class);
        JsonObject states = states(user, subject);
        List<String> topics = couch.topicsAsList(subject);
        states.entrySet().removeIf(entry -> {
            String key = entry.getKey();
            JsonElement value = entry.getValue();
            return !"_id".equals(key) && !"_rev".equals(key) && !topics.contains(key) || (value.getAsJsonPrimitive().isNumber() && value.getAsInt() == 0);
        });
        states.add(object.get("id").getAsString(), object.get("rate"));
        client.update(states);
        return statesAndProgress(user, subject);
    }

    private static Properties readProperties(String fileName) throws IOException {
        Properties properties = new Properties();
        properties.load(new FileInputStream(fileName));
        return properties;
    }

    private void fixStates() {
        CouchDbClient client = getClient();
        View view = client.view("_all_docs")
                .reduce(false)
                .includeDocs(true);
        List<JsonObject> list = view.query(JsonObject.class);
        List<JsonObject> deleted = new ArrayList<>();
        List<JsonObject> added = new ArrayList<>();
        for (JsonObject object : list) {
            String id = string(object, "_id");
            int pos = id.lastIndexOf(".");
            String subject = id.substring(pos+1);
            id = id.substring(0, pos);
            if (!id.equals(id.toLowerCase())) {
                System.out.println("id = " + id);
                JsonObject delete = new JsonObject();
                delete.addProperty("_id", id + "." + subject);
                delete.add("_rev", object.get("_rev"));
                delete.addProperty("_deleted", true);
                deleted.add(delete);

                object.remove("_rev");
                object.addProperty("_id", id.toLowerCase() + "." + subject);
                added.add(object);
            }
        }
        System.out.println("added = " + added);
        System.out.println("deleted = " + deleted);

        if (!deleted.isEmpty())
            client.bulk(deleted, true);
        if (!added.isEmpty())
            client.bulk(added, true);
    }

    public static void main(String[] args) throws IOException {
        Server.CLIENT.set(args[1]);
        States couch = new States(new Couch(readProperties(args[0])));
        //JsonObject object = couch.chapter("mathe", "Mathematik");
        //System.out.println("object = " + object);
        //JsonObject states = couch.statesAndProgress("h.engels", "Mathematik");
        //System.out.println("states = " + states);
        //JsonObject states = couch.courseStates("lala", "test", "Mathematik");
        //System.out.println("states = " + states);
        couch.fixStates();
    }
}
