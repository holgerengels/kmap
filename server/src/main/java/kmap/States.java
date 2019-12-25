package kmap;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonPrimitive;
import org.lightcouch.*;

import java.io.FileInputStream;
import java.io.IOException;
import java.util.*;

/**
 * Created by holger on 04.04.17.
 */
public class States {
    private Couch couch;

    public States(Couch couch) {
        this.couch = couch;
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

    public JsonArray courses(String user) {
        CouchDbClient client = getClient();
        JsonObject object;
        try {
            object = client.find(JsonObject.class, user + ".courses");
        }
        catch (NoDocumentException e) {
            JsonObject courses = new JsonObject();
            courses.addProperty("_id", user + ".courses");
            courses.add("courses", new JsonArray());
            client.save(courses);
            object = client.find(JsonObject.class, user + ".courses");
        }

        return JSON.sort(object.getAsJsonArray("courses"));
    }

    public JsonArray course(String user, String name) {
        CouchDbClient client = getClient();
        try {
            JsonObject object = client.find(JsonObject.class, user + ".courses");
            return object.getAsJsonArray(name);
        }
        catch (NoDocumentException e) {
            System.out.println("there should be a document = " + e);
            throw new RuntimeException(e);
        }
    }

    public void storeCourses(String user, String json) {
        CouchDbClient client = getClient();
        JsonObject data = client.getGson().fromJson(json, JsonObject.class);
        try {
            JsonObject object = client.find(JsonObject.class, user + ".courses");
            JsonArray courses = data.getAsJsonArray("courses");
            courses = JSON.sort(courses);
            object.add("courses", courses);
            for (Iterator<Map.Entry<String, JsonElement>> iterator = object.entrySet().iterator(); iterator.hasNext(); ) {
                Map.Entry<String, JsonElement> entry = iterator.next();
                if ("_id|_rev|courses".contains(entry.getKey()))
                    continue;
                if (!courses.contains(new JsonPrimitive(entry.getKey())))
                    iterator.remove();
            }
            client.update(object);
        }
        catch (NoDocumentException e) {
            System.out.println("there should be a document = " + e);
            throw new RuntimeException(e);
        }
    }

    public void storeCourse(String user, String name, String json) {
        CouchDbClient client = getClient();
        JsonObject data = client.getGson().fromJson(json, JsonObject.class);
        try {
            JsonObject object = client.find(JsonObject.class, user + ".courses");
            object.add(name, data.getAsJsonArray("students"));
            JsonArray courses = object.get("courses").getAsJsonArray();
            if (!courses.contains(new JsonPrimitive(name)))
                courses.add(name);
            client.update(object);
        }
        catch (NoDocumentException e) {
            System.out.println("there should be a document = " + e);
            throw new RuntimeException(e);
        }
    }

    public synchronized JsonObject courseStates(String user, String course, String subject) {
        Map<String, Couch.WeightedSum> map = new HashMap<>();
        JsonArray array = course(user, course);
        for (JsonElement element : array) {
            JsonObject states = states(element.getAsString(), subject);
            states.remove("_id");
            states.remove("_rev");
            states.entrySet().forEach(entry -> map.merge(entry.getKey(), new Couch.WeightedSum(entry.getValue().getAsInt()), Couch.WeightedSum::add));
        }

        JsonObject states = new JsonObject();
        states.addProperty("@", array.size());

        for (Map.Entry<String, Couch.WeightedSum> entry : map.entrySet()) {
            String topic = entry.getKey();
            Couch.WeightedSum weightedSum = entry.getValue();
            states.addProperty(topic, Math.round(weightedSum.average()));
            states.addProperty(topic + "*", weightedSum.getCount());
        }
        averageAndProgress(states, subject);

        return states;
    }

    public synchronized JsonObject store(String user, String subject, String json) {
        CouchDbClient client = getClient();
        JsonObject object = client.getGson().fromJson(json, JsonObject.class);
        JsonObject states = states(user, subject);
        Set<String> topics = couch.topics(subject);
        states.entrySet().removeIf(entry -> {
            String key = entry.getKey();
            JsonElement value = entry.getValue();
            return !"_id".equals(key) && !"_rev".equals(key) && !topics.contains(key) || (value.getAsJsonPrimitive().isNumber() && value.getAsInt() == 0);
        });
        states.add(object.get("id").getAsString(), object.get("rate"));
        client.update(states);
        return statesAndProgress(user, subject);
    }

    public static void main(String[] args) throws IOException {
        States couch = new States(new Couch(readProperties(args[0])));
        //JsonObject object = couch.chapter("mathe", "Mathematik");
        //System.out.println("object = " + object);
        //JsonObject states = couch.statesAndProgress("h.engels", "Mathematik");
        //System.out.println("states = " + states);
        JsonObject states = couch.courseStates("lala", "test", "Mathematik");
        System.out.println("states = " + states);
    }

    private static Properties readProperties(String fileName) throws IOException {
        Properties properties = new Properties();
        properties.load(new FileInputStream(fileName));
        return properties;
    }
}
