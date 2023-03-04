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
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import static kmap.JSON.loong;
import static kmap.JSON.string;

public class SearchServlet extends JsonServlet {
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
        String search = req.getParameter("search");
        try {
            Server.CLIENT.set("root");
            XMLOutputFactory factory = XMLOutputFactory.newInstance();
            XMLEventWriter eventWriter = factory.createXMLEventWriter(resp.getOutputStream());
            XMLEventFactory eventFactory = XMLEventFactory.newInstance();

            eventWriter.add(eventFactory.createStartDocument());
            eventWriter.add(eventFactory.createCharacters("\n"));

            startNode(eventWriter, "occurences");

            if (subject != null) {
                JsonArray array = couch.latest(subject, 100000, false);
                for (JsonElement element : array) {
                    JsonObject card = (JsonObject) element;
                    String links = string(card, "links");
                    if (links != null)
                        continue;

                    Pattern p = Pattern.compile(search);
                    String summary = string(card, "summary");
                    String description = string(card, "description");
                    String keywords = string(card, "keywords");
                    boolean s = summary != null && p.matcher(summary).find();
                    boolean d = description != null && p.matcher(description).find();
                    boolean k = keywords != null && p.matcher(keywords).find();
                    if (!s && !d && !k)
                        continue;

                    startNode(eventWriter, "occurrence");

                    String chapter = string(card, "chapter");
                    String topic = string(card, "topic");
                    String url = "https://kmap.eu/app/browser/" + URLs.encode(subject) + "/" + URLs.encode(chapter) + "/" + URLs.encode(topic);

                    eventWriter.add(eventFactory.createStartElement("", "", "a", new SingletonIterator(eventFactory.createAttribute("href", url)), null));
                    endNode(eventWriter, "a");

                    if (s)
                        emptyNode(eventWriter, "summary");
                    if (d)
                        emptyNode(eventWriter, "description");
                    if (k)
                        emptyNode(eventWriter, "keywords");

                    endNode(eventWriter, "occurence");
                }

                JsonArray tarray = tests.latestThin(subject, 100000);
                for (JsonElement element : tarray) {
                    JsonObject card = (JsonObject) element;

                    Pattern p = Pattern.compile(search);
                    String question = string(card, "question");
                    String answer = string(card, "answer");
                    boolean q = question != null && p.matcher(question).find();
                    boolean a = answer != null && p.matcher(answer).find();
                    if (!q && !a)
                        continue;

                    startNode(eventWriter, "occurrence");

                    String chapter = string(card, "chapter");
                    String topic = string(card, "topic");
                    String key = string(card, "key");
                    String url = "https://kmap.eu/app/exercise/" + URLs.encode(subject) + "/" + URLs.encode(chapter) + "/" + URLs.encode(topic) + "/" + URLs.encode(key);

                    eventWriter.add(eventFactory.createStartElement("", "", "a", new SingletonIterator(eventFactory.createAttribute("href", url)), null));
                    endNode(eventWriter, "a");

                    if (q)
                        emptyNode(eventWriter, "question");
                    if (a)
                        emptyNode(eventWriter, "answer");

                    endNode(eventWriter, "occurence");
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
