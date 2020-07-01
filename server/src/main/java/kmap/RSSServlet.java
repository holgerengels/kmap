package kmap;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import org.apache.commons.codec.digest.DigestUtils;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.xml.stream.XMLEventFactory;
import javax.xml.stream.XMLEventWriter;
import javax.xml.stream.XMLOutputFactory;
import javax.xml.stream.XMLStreamException;
import javax.xml.stream.events.*;
import java.io.IOException;
import java.security.MessageDigest;
import java.text.SimpleDateFormat;
import java.util.Arrays;
import java.util.Date;
import java.util.Locale;

import static kmap.JSON.loong;
import static kmap.JSON.string;

public class RSSServlet extends JsonServlet {
    private Couch couch;
    private String file;

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

            createNode(eventWriter, "title", "KMap");
            createNode(eventWriter, "link", "https://kmap.eu");
            createNode(eventWriter, "description", "KMap kartographiert Wissen mit Zusammenhang");
            createNode(eventWriter, "language", Locale.GERMANY.toLanguageTag());
            createNode(eventWriter, "copyright", "KMap Team");
            SimpleDateFormat date_format = new SimpleDateFormat("EEE', 'dd' 'MMM' 'yyyy' 'HH:mm:ss' 'Z", Locale.GERMANY);
            createNode(eventWriter, "pubDate", date_format.format(new Date()));

            if (subject != null) {
                JsonArray array = couch.latest(subject, 5);
                for (JsonElement element : array) {
                    JsonObject card = (JsonObject) element;
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
                    createNode(eventWriter, "link", "https://kmap.eu/browser/" + subject + "/" + chapter + "/" + topic);
                    createNode(eventWriter, "author", author);
                    createNode(eventWriter, "guid", DigestUtils.md5Hex(subject + "/" + chapter + "/" + topic));
                    if (modified != null)
                        createNode(eventWriter, "pubDate", date_format.format(new Date(modified)));
                    if (keywords != null) {
                        for (String keyword : keywords.split(",")) {
                            keyword = keyword.trim();
                            createNode(eventWriter, "category", keyword, true);
                        }
                    }

                    eventWriter.add(end);
                    eventWriter.add(eventFactory.createEndElement("", "", "item"));
                    eventWriter.add(end);

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

    private void createNode(XMLEventWriter eventWriter, String name, String value)
            throws XMLStreamException {
        createNode(eventWriter, name, value, false);
    }

    private void createNode(XMLEventWriter eventWriter, String name, String value, boolean cdata)
            throws XMLStreamException {
        XMLEventFactory eventFactory = XMLEventFactory.newInstance();
        XMLEvent end = eventFactory.createDTD("\n");
        XMLEvent tab = eventFactory.createDTD("\t");
        // create Start node
        StartElement sElement = eventFactory.createStartElement("", "", name);
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
