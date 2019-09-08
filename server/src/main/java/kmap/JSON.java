package kmap;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonPrimitive;

import java.util.Comparator;
import java.util.stream.StreamSupport;

public class JSON {
    public static boolean isNull(JsonObject topic, String name) {
        return topic.get(name).isJsonNull();
    }

    public static String string(JsonObject topic, String name) {
        JsonPrimitive primitive = topic.getAsJsonPrimitive(name);
        return primitive != null ? primitive.getAsString() : null;
    }

    public static Integer integer(JsonObject topic, String name) {
        JsonPrimitive primitive = topic.getAsJsonPrimitive(name);
        return primitive != null && primitive.getAsString().length() != 0 ? primitive.getAsInt() : null;
    }

    static JsonArray sort(JsonArray array) {
        JsonArray newArray = new JsonArray();
        StreamSupport.stream(array.spliterator(), false).sorted(Comparator.comparing(JsonElement::getAsString)).forEach(newArray::add);
        return newArray;
    }
}
