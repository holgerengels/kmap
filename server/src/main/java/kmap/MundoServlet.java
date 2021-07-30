package kmap;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.apache.commons.codec.digest.DigestUtils;

import javax.xml.stream.XMLEventFactory;
import javax.xml.stream.XMLEventWriter;
import javax.xml.stream.XMLOutputFactory;
import javax.xml.stream.XMLStreamException;
import javax.xml.stream.events.*;
import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.*;
import java.util.stream.Collectors;

import static kmap.JSON.*;

public class MundoServlet extends JsonServlet {
    private Couch couch;

    @Override
    public void init() throws ServletException {
        super.init();
        couch = new Couch(properties);
    }

    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        newSessionHeader(req, resp);
        resp.setContentType("application/rss+xml");
        resp.setCharacterEncoding("utf-8");

        String subject = extractSubject(req);
        Integer count = extractCount(req);
        if (count == null)
            count = 5;

        try {
            Server.CLIENT.set("root");
            XMLOutputFactory factory = XMLOutputFactory.newInstance();
            XMLEventWriter eventWriter = factory.createXMLEventWriter(resp.getOutputStream());

            XMLEventFactory eventFactory = XMLEventFactory.newInstance();
            XMLEvent end = eventFactory.createDTD("\n");

            StartDocument startDocument = eventFactory.createStartDocument();
            eventWriter.add(startDocument);
            eventWriter.add(end);

            StartElement rssStart = eventFactory.createStartElement("", "", "rss");
            eventWriter.add(rssStart);
            eventWriter.add(eventFactory.createAttribute("version", "2.0"));
            eventWriter.add(end);

            eventWriter.add(eventFactory.createStartElement("", "", "channel"));
            eventWriter.add(end);

            createNode(eventWriter, "title", "KMap - " + subject);
            createNode(eventWriter, "link", "https://kmap.eu");
            createNode(eventWriter, "description", "KMap kartographiert Wissen mit Zusammenhang");
            createNode(eventWriter, "language", Locale.GERMANY.toLanguageTag());
            createNode(eventWriter, "copyright", "KMap Team");
            SimpleDateFormat date_format = new SimpleDateFormat("EEE', 'dd' 'MMM' 'yyyy' 'HH:mm:ss' 'Z", Locale.ENGLISH);
            createNode(eventWriter, "pubDate", date_format.format(new Date()));

            if (subject != null) {
                JsonArray array = couch.latest(subject, count);
                for (JsonElement element : array) {
                    JsonObject card = (JsonObject)element;
                    eventWriter.add(eventFactory.createStartElement("", "", "item"));
                    eventWriter.add(end);

                    String chapter = string(card, "chapter");
                    String topic = string(card, "topic");
                    String author = string(card, "author");
                    if (author == null)
                        author = "KMap Team";
                    Long modified = loong(card, "modified");
                    String keywords = string(card, "keywords");
                    createNode(eventWriter, "title", chapter + " - " + topic);
                    createNode(eventWriter, "description", string(card, "summary"));
                    createNode(eventWriter, "link", "https://kmap.eu/app/browser/" + URLs.encode(subject) + "/" + URLs.encode(chapter) + "/" + URLs.encode(topic));
                    createNode(eventWriter, "author", author);
                    createNode(eventWriter, "guid", DigestUtils.md5Hex(subject + "/" + chapter + "/" + topic), Collections.singletonMap("isPermaLink", "false"));
                    if (modified != null)
                        createNode(eventWriter, "pubDate", date_format.format(new Date(modified)));

                    Integer sgs = integer(card, "sgs");
                    if (sgs != null)
                        createNode(eventWriter, "category", "" + sgs, Map.of("domain", "eaf-classification-coded"), false);

                    keywords = keywords == null ? chapter + ", " + topic : chapter + ", " + topic + ", " + keywords;
                    createNode(eventWriter, "itunes:keywords", keywords, null, false);
                    createNode(eventWriter, "itunes:image", null, Map.of("href", "https://kmap.eu/snappy/" + URLs.encode(subject) + "/" + URLs.encode(chapter) + "/" + URLs.encode(topic)), false);

                    createNode(eventWriter, "sdx:userGroups", "pupils");
                    createNode(eventWriter, "sdx:learnResourceType", "Text");
                    createNode(eventWriter, "sdx:educationalLevel", string(card, "educationalContext"));
                    createNode(eventWriter, "sdx:classLevel", minmax(string(card, "educationalLevel")));
                    createNode(eventWriter, "sdx:schoolType", "Gymnasium, Fachoberschule");
                    createNode(eventWriter, "sdx:subject", string(card, "sgs"));
                    createNode(eventWriter, "sdx:licenseName", "CC BY-SA");
                    createNode(eventWriter, "sdx:licenseVersion", "4.0");
                    createNode(eventWriter, "sdx:costs", "FREE");

                    eventWriter.add(end);
                    eventWriter.add(eventFactory.createEndElement("", "", "item"));
                    eventWriter.add(end);

                    // sdx:learnResourceType: Text? Webseite, Webtool, App
                }
            }

            eventWriter.add(end);
            eventWriter.add(eventFactory.createEndElement("", "", "channel"));
            eventWriter.add(end);
            eventWriter.add(eventFactory.createEndElement("", "", "rss"));

            eventWriter.add(end);
            eventWriter.add(eventFactory.createEndDocument());
        } catch (Exception e) {
            e.printStackTrace();
            sendError(req, resp, e);
        } finally {
            Server.CLIENT.remove();
        }
    }

    private String minmax(String string) {
        if (string == null)
            return "";

        List<Integer> list = Arrays.stream(string.split(",")).map(String::trim).map(Integer::parseInt).sorted().collect(Collectors.toList());
        Optional<Integer> min = list.stream().min(Integer::compare);
        Optional<Integer> max = list.stream().max(Integer::compare);
        return min.equals(max) ? "" + min : min + "-" + max;
    }

    private Integer extractCount(HttpServletRequest req) {
        String count = req.getParameter("count");
        if (count == null)
            return null;
        return "*".equals(count) ? Integer.MAX_VALUE : Integer.parseInt(count);
    }

    private String extractSubject(HttpServletRequest req) {
        String pathInfo = req.getPathInfo();
        System.out.println("pathInfo = " + pathInfo);
        if (pathInfo != null) {
            String[] path = pathInfo.substring(1).split("/");
            System.out.println("path = " + Arrays.asList(path));
            if (path.length == 1) {
                return path[0];
            }
        }
        return null;
    }

    private void createNode(XMLEventWriter eventWriter, String name, String value) throws XMLStreamException {
        createNode(eventWriter, name, value, null, false);
    }
    private void createNode(XMLEventWriter eventWriter, String name, String value, Map<String, String> attributes)
            throws XMLStreamException {
        createNode(eventWriter, name, value, attributes, false);
    }

    private void createNode(XMLEventWriter eventWriter, String name, String value, Map<String, String> attributes, boolean cdata)
            throws XMLStreamException {
        XMLEventFactory eventFactory = XMLEventFactory.newInstance();
        XMLEvent end = eventFactory.createDTD("\n");
        XMLEvent tab = eventFactory.createDTD("\t");
        // create Start node
        List<Attribute> attrs = attributes != null
                ? attributes.entrySet().stream().map((entry) -> eventFactory.createAttribute(entry.getKey(), entry.getValue())).collect(Collectors.toList())
                : null;
        StartElement sElement = attrs != null
                ? eventFactory.createStartElement("", "", name, attrs.iterator(), null)
                : eventFactory.createStartElement("", "", name);
        eventWriter.add(tab);
        eventWriter.add(sElement);
        // create Content
        Characters characters = cdata ? eventFactory.createCData(value) : eventFactory.createCharacters(value);
        eventWriter.add(characters);
        // create End node
        EndElement eElement = eventFactory.createEndElement("", "", name);
        eventWriter.add(eElement);
        eventWriter.add(end);
    }
}
