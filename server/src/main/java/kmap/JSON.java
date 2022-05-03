package kmap;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonPrimitive;

import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.Comparator;
import java.util.Date;
import java.util.List;
import java.util.Locale;
import java.util.stream.StreamSupport;

public class JSON {
    private static DateFormat format = new SimpleDateFormat("yyyy-MM-dd", Locale.ENGLISH);

    public static boolean isNull(JsonObject topic, String name) {
        return topic.get(name).isJsonNull();
    }

    public static String stringTrim(JsonObject topic, String name) {
        JsonPrimitive primitive = topic.getAsJsonPrimitive(name);
        return primitive != null ? primitive.getAsString().trim() : null;
    }

    public static String string(JsonObject topic, String name) {
        JsonPrimitive primitive = topic.getAsJsonPrimitive(name);
        return primitive != null ? primitive.getAsString() : null;
    }

    public static String string(JsonObject topic, String name, String defaultValue) {
        JsonPrimitive primitive = topic.getAsJsonPrimitive(name);
        return primitive != null ? primitive.getAsString() : defaultValue;
    }

    public static Integer integer(JsonObject topic, String name) {
        JsonPrimitive primitive = topic.getAsJsonPrimitive(name);
        return primitive != null && primitive.getAsString().length() != 0 ? primitive.getAsInt() : null;
    }

    public static Integer integer(JsonObject topic, String name, Integer defaultValue) {
        JsonPrimitive primitive = topic.getAsJsonPrimitive(name);
        return primitive != null && primitive.getAsString().length() != 0 ? primitive.getAsInt() : defaultValue;
    }

    public static Long loong(JsonObject topic, String name) {
        JsonPrimitive primitive = topic.getAsJsonPrimitive(name);
        return primitive != null && primitive.getAsString().length() != 0 ? primitive.getAsLong() : null;
    }

    public static Long loong(JsonObject topic, String name, Long defaultValue) {
        JsonPrimitive primitive = topic.getAsJsonPrimitive(name);
        return primitive != null && primitive.getAsString().length() != 0 ? primitive.getAsLong() : defaultValue;
    }

    static JsonArray sort(JsonArray array) {
        JsonArray newArray = new JsonArray();
        StreamSupport.stream(array.spliterator(), false).sorted(Comparator.comparing(JsonElement::getAsString)).forEach(newArray::add);
        return newArray;
    }

    static JsonArray toArray(List<JsonObject> objects) {
        JsonArray array = new JsonArray();
        objects.forEach(array::add);
        return array;
    }

    static JsonArray sortedArray(List<JsonObject> objects, String member) {
        JsonArray array = new JsonArray();
        objects.stream().sorted(Comparator.comparing(o -> o.getAsJsonPrimitive(member).getAsString())).forEach(array::add);
        return array;
    }

    static boolean removeEmptyStrings(JsonObject o) {
        return o.entrySet().removeIf(entry -> entry.getValue().isJsonPrimitive() && "".equals(entry.getValue().getAsString()));
    }

    static void add(JsonObject card, String name, JsonArray array) {
        if (array != null)
            card.add(name, array);
    }

    static void addProperty(JsonObject card, String name, String value) {
        if (value != null && value.length() != 0)
            card.addProperty(name, value);
    }

    static void addProperty(JsonObject card, String name, Integer value) {
        if (value != null)
            card.addProperty(name, value);
    }

    public static String date(JsonObject object, String name) {
        JsonPrimitive primitive = object.getAsJsonPrimitive(name);
        return primitive != null ? format.format(new Date(primitive.getAsLong())) : null;
    }

    public static String date(JsonObject object, String name, long defaultValue) {
        JsonPrimitive primitive = object.getAsJsonPrimitive(name);
        return format.format(new Date(primitive != null ? primitive.getAsLong() : defaultValue));
    }
}
