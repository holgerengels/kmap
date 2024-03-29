package kmap;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.apache.commons.collections.iterators.SingletonIterator;
import org.apache.commons.collections4.IteratorUtils;

import javax.xml.stream.XMLEventFactory;
import javax.xml.stream.XMLEventWriter;
import javax.xml.stream.XMLOutputFactory;
import javax.xml.stream.XMLStreamException;
import javax.xml.stream.events.*;
import java.io.IOException;
import java.util.*;
import java.util.stream.Collectors;

import static kmap.JSON.*;

public class SEOServlet extends JsonServlet {
    private Couch couch;
    private Tests tests;
    private String file;

    @Override
    public void init() throws ServletException {
        super.init();
        couch = new Couch(properties);
        tests = new Tests(couch);
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

            eventWriter.add(eventFactory.createStartDocument());
            eventWriter.add(eventFactory.createCharacters("\n"));

            startNode(eventWriter, "checks");

            if (subject != null) {
                JsonArray array = couch.latest(subject, 100000, false);
                List<JsonElement> list = toList(array);
                list.sort(Comparator.comparing((o) -> string((JsonObject)o, "chapter")).thenComparing((o) -> string((JsonObject)o, "topic")));
                for (JsonElement element : list) {
                    JsonObject card = (JsonObject) element;
                    String links = string(card, "links");
                    if (links != null)
                        continue;
                    Long created = loong(card, "created");
                    String thumb = string(card, "thumb");
                    String keywords = string(card, "keywords");
                    boolean image = IteratorUtils.toList(card.getAsJsonArray("attachments").iterator()).stream().anyMatch(a -> {
                        String mime = string((JsonObject) a, "mime");
                        return mime != null && mime.startsWith("image/");
                    });
                    if (created != null && keywords != null && (thumb != null || !image))
                        continue;

                    startNode(eventWriter, "missing");

                    String chapter = string(card, "chapter");
                    String topic = string(card, "topic");
                    String url = "https://kmap.eu/app/browser/" + URLs.encode(subject) + "/" + URLs.encode(chapter) + "/" + URLs.encode(topic);

                    eventWriter.add(eventFactory.createStartElement("", "", "a", new SingletonIterator(eventFactory.createAttribute("href", url)), null));
                    endNode(eventWriter, "a");

                    if (created == null)
                        emptyNode(eventWriter, "created");
                    if (thumb == null)
                        emptyNode(eventWriter, "thumb");
                    if (keywords == null)
                        emptyNode(eventWriter, "keywords");

                    endNode(eventWriter, "missing");
                }
            }

            eventWriter.add(eventFactory.createEndElement("", "", "checks"));
            eventWriter.add(eventFactory.createEndDocument());
        } catch (Exception e) {
            e.printStackTrace();
            sendError(req, resp, e);
        } finally {
            Server.CLIENT.remove();
        }
    }

    private static void emptyNode(XMLEventWriter eventWriter, String name) throws XMLStreamException {
        startNode(eventWriter, name);
        endNode(eventWriter, name);
    }
    private static void startNode(XMLEventWriter eventWriter, String name) throws XMLStreamException {
        XMLEventFactory eventFactory = XMLEventFactory.newInstance();
        eventWriter.add(eventFactory.createStartElement("", "", name));
    }
    private static void endNode(XMLEventWriter eventWriter, String name) throws XMLStreamException {
        XMLEventFactory eventFactory = XMLEventFactory.newInstance();
        eventWriter.add(eventFactory.createEndElement("", "", name));
        eventWriter.add(eventFactory.createCharacters("\n"));
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
