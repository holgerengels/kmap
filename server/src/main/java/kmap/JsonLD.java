package kmap;

import com.google.gson.JsonObject;

import javax.json.Json;
import javax.json.JsonArrayBuilder;
import javax.json.JsonObjectBuilder;
import javax.json.stream.JsonGenerator;
import java.io.IOException;
import java.io.StringWriter;
import java.io.Writer;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;

import static kmap.JSON.string;
import static kmap.URLs.encodePath;
import static kmap.Server.readProperties;

public class JsonLD {
    static String SERVER = "https://kmap.eu/";

    public String jsonld(JsonObject card) {

        String subject = JSON.string(card, "subject");
        String chapter = JSON.string(card, "chapter");
        String topic = JSON.string(card, "topic");
        String title = topic != null ? chapter  + " - " + topic : chapter;
        String description = JSON.string(card, "summary");
        if (description == null) description = "KMap kartographiert Wissen mit Zusammenhang";
        String image = JSON.string(card, "thumb") != null
                ? SERVER + encodePath("server", "data", subject, chapter, topic, JSON.string(card, "thumb")) + "?instance=root"
                : "https://kmap.eu/app/icons/KMap-Logo-cropped.png";
        String keywords = JSON.string(card, "keywords", "");
        if (keywords.length() != 0) keywords += ", ";
        keywords += subject + ", " + chapter + ", " + topic;
        String created = JSON.date(card, "created", System.currentTimeMillis());
        String modified = JSON.date(card, "modified", JSON.loong(card, "created", System.currentTimeMillis()));

        Writer writer = new StringWriter();
        Map<String, String> config = new HashMap<>();
        config.put(JsonGenerator.PRETTY_PRINTING, "");
        Json.createWriterFactory(config).createWriter(writer).writeObject(Json.createObjectBuilder()
                .add("@context", "https://schema.org")
                .add("@type", "WebPage")
                .add("breadcrumb", breadCrumbs(subject, chapter, topic))
                .add("mainEntity", Json.createObjectBuilder()
                        .add("@type", "Article")
                        .add("headline", title)
                        .add("name", title)
                        .add("description", description)
                        .add("keywords", keywords)
                        .add("mainEntityOfPage", SERVER + encodePath("app", "browser", subject, chapter, topic))
                        .add("image", image)
                        .add("datePublished", created)
                        .add("dateModified", modified)
                        .add("author", string(card, "author") != null
                                ? Json.createObjectBuilder()
                                .add("@type", "Person")
                                .add("name", string(card, "author"))
                                : Json.createObjectBuilder()
                                .add("@type", "Organization")
                                .add("name", "KMap Team")
                        )
                        .add("publisher", Json.createObjectBuilder()
                                .add("@type", "Organization")
                                .add("name", "KMap Team")
                                .add("email", "hengels@gmail.com")
                                .add("logo", Json.createObjectBuilder()
                                        .add("@type", "ImageObject")
                                        .add("url", "https://kmap.eu/app/icons/KMap-Logo-cropped.png")
                                )
                        )
                        .add("license", "https://creativecommons.org/licenses/by-sa/4.0/")
                        .add("inLanguage", Json.createArrayBuilder().add("de"))
                        .add("audience", Json.createArrayBuilder().add("Lerner/in"))
                        .add("about", Json.createArrayBuilder().add(subject))
                        .add("learningResourceType", Json.createArrayBuilder().add("Text"))
                        .add("thumbnailUrl", SERVER + encodePath("snappy", subject, chapter, topic))
                        .addAll(arrayFromString("educationalLevel", string(card, "educationalLevel")))
                        .addAll(arrayFromString("oeh:educationalContext", string(card, "educationalContext")))
                        .addAll(optional("typicalAgeRange", string(card, "typicalAgeRange")))
                )
                .build());

        return writer.toString();
    }

    private JsonObjectBuilder breadCrumbs(String... breadcrumbs) {
        JsonArrayBuilder arrayBuilder = Json.createArrayBuilder();
        AtomicInteger index = new AtomicInteger();
        Arrays.stream(breadcrumbs).map(b ->
            Json.createObjectBuilder()
                    .add("@type", "ListItem")
                    .add("position", index.incrementAndGet())
                    .add("name", b)
                    .add("item", SERVER + "app/browser/" + (index.get() == 1
                            ? encodePath(breadcrumbs[0], breadcrumbs[0])
                            : encodePath(Arrays.copyOfRange(breadcrumbs, 0, index.get()))))
        ).forEach(arrayBuilder::add);

        return Json.createObjectBuilder()
                .add("@context", "https://schema.org")
                .add("@type", "BreadcrumbList")
                .add("itemListElement", arrayBuilder);
    }

    JsonObjectBuilder arrayFromString(String name, String string) {
        JsonObjectBuilder objectBuilder = Json.createObjectBuilder();
        if (string != null) {
            JsonArrayBuilder arrayBuilder = Json.createArrayBuilder();
            Arrays.stream(string.split(",")).map(String::trim).forEach(arrayBuilder::add);
            objectBuilder.add(name, arrayBuilder);
        }
        return objectBuilder;
    }
    JsonObjectBuilder optional(String name, String string) {
        JsonObjectBuilder objectBuilder = Json.createObjectBuilder();
        if (string != null) {
            objectBuilder.add(name, string);
        }
        return objectBuilder;
    }

    public static void main(String[] args) throws IOException {
        Couch couch = new Couch(readProperties(args[0]));
        Server.CLIENT.set("root");
        JsonObject card = couch.loadTopic("Mathematik", "Differentialrechnung", "Momentane Änderungsrate");
        String jsonld = new JsonLD().jsonld(card);
        System.out.println("jsonld = " + jsonld);
    }
}
