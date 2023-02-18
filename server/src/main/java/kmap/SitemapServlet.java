package kmap;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import javax.xml.stream.XMLEventFactory;
import javax.xml.stream.XMLEventWriter;
import javax.xml.stream.XMLOutputFactory;
import javax.xml.stream.XMLStreamException;
import javax.xml.stream.events.*;
import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.*;
import java.util.stream.Collectors;

import static kmap.JSON.loong;
import static kmap.JSON.string;

public class SitemapServlet extends JsonServlet {
    private Couch couch;
    private Tests tests;
    private String file;

    @Override
    public void init() throws ServletException {
        super.init();
        couch = new Couch(properties);
        tests = new Tests(couch);
    }

    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        newSessionHeader(req, resp);
        resp.setContentType("application/xml");
        resp.setCharacterEncoding("utf-8");

        String subject = extractSubject(req);
        try {
            Server.CLIENT.set("root");
            XMLOutputFactory factory = XMLOutputFactory.newInstance();
            XMLEventWriter eventWriter = factory.createXMLEventWriter(resp.getOutputStream());

            XMLEventFactory eventFactory = XMLEventFactory.newInstance();
            XMLEvent end = eventFactory.createDTD("\n");

            StartDocument startDocument = eventFactory.createStartDocument();
            eventWriter.add(startDocument);
            eventWriter.add(end);

            StartElement urlsetStart = eventFactory.createStartElement("", "", "urlset");
            eventWriter.add(urlsetStart);
            eventWriter.add(eventFactory.createAttribute("xmlns", "http://www.sitemaps.org/schemas/sitemap/0.9"));
            eventWriter.add(end);

            SimpleDateFormat date_format = new SimpleDateFormat("yyyy-MM-dd", Locale.ENGLISH);
            Long start = new SimpleDateFormat("dd/MM/yyyy").parse("01/01/2020").getTime();

            if (subject != null) {
                JsonArray array = couch.latest(subject, 100000, false);
                Map<String, Long> map = new HashMap<>();
                for (JsonElement element : array) {
                    JsonObject card = (JsonObject) element;
                    eventWriter.add(eventFactory.createStartElement("", "", "url"));
                    eventWriter.add(end);

                    String chapter = string(card, "chapter");
                    String topic = string(card, "topic");
                    Long modified = loong(card, "modified");
                    if (modified == null)
                        modified = start;
                    createNode(eventWriter, "loc", blogHack("https://kmap.eu/app/browser/" + URLs.encode(subject) + "/" + URLs.encode(chapter) + "/" + URLs.encode(topic)));
                    createNode(eventWriter, "lastmod", date_format.format(new Date(modified)));

                    eventWriter.add(end);
                    eventWriter.add(eventFactory.createEndElement("", "", "url"));
                    eventWriter.add(end);

                    Long lala = map.get(chapter);
                    if (lala == null || lala < modified)
                        map.put(chapter, modified);
                }

                for (Map.Entry<String, Long> entry : map.entrySet()) {
                    String chapter = entry.getKey();
                    Long modified = entry.getValue();
                    eventWriter.add(eventFactory.createStartElement("", "", "url"));
                    eventWriter.add(end);

                    createNode(eventWriter, "loc", blogHack("https://kmap.eu/app/browser/" + URLs.encode(subject) + "/" + URLs.encode(chapter)));
                    createNode(eventWriter, "lastmod", date_format.format(new Date(modified)));

                    eventWriter.add(end);
                    eventWriter.add(eventFactory.createEndElement("", "", "url"));
                    eventWriter.add(end);
                }

                array = tests.latestThin(subject, 100000);
                for (JsonElement element : array) {
                    JsonObject test = (JsonObject)element;
                    eventWriter.add(eventFactory.createStartElement("", "", "url"));
                    eventWriter.add(end);

                    String chapter = string(test, "chapter");
                    String topic = string(test, "topic");
                    String key = string(test, "key");
                    Long modified = loong(test, "modified");
                    if (modified == null)
                        modified = start;
                    createNode(eventWriter, "loc", "https://kmap.eu/app/exercise/" + URLs.encode(subject) + "/" + URLs.encode(chapter) + "/" + URLs.encode(topic) + "/" + URLs.encode(key));
                    createNode(eventWriter, "lastmod", date_format.format(new Date(modified)));

                    eventWriter.add(end);
                    eventWriter.add(eventFactory.createEndElement("", "", "url"));
                    eventWriter.add(end);
                }
            }

            eventWriter.add(end);
            eventWriter.add(eventFactory.createEndElement("", "", "urlset"));

            eventWriter.add(end);
            eventWriter.add(eventFactory.createEndDocument());
        } catch (Exception e) {
            e.printStackTrace();
            sendError(req, resp, e);
        } finally {
            Server.CLIENT.remove();
        }
    }

    private String blogHack(String url) {
        return url.replace("/browser/Blog/Blog", "/blog");
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
