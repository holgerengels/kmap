package kmap;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.jsoup.Jsoup;

import javax.xml.stream.XMLEventFactory;
import javax.xml.stream.XMLEventWriter;
import javax.xml.stream.XMLOutputFactory;
import javax.xml.stream.XMLStreamException;
import javax.xml.stream.events.*;
import java.io.IOException;
import java.io.OutputStreamWriter;
import java.io.Writer;
import java.text.SimpleDateFormat;
import java.util.*;
import java.util.stream.Collectors;

import static kmap.JSON.loong;
import static kmap.JSON.string;

public class AIConnectorServlet extends JsonServlet {
    private Couch couch;

    @Override
    public void init() throws ServletException {
        super.init();
        couch = new Couch(properties);
    }

    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        newSessionHeader(req, resp);
        resp.setContentType("application/jsonlines+json");
        resp.setCharacterEncoding("utf-8");

        String subject = extractSubject(req);
        try {
            Server.CLIENT.set("root");

            if (subject != null) {
                JsonArray array = couch.latest(subject, 100000);

                Writer out = new OutputStreamWriter(resp.getOutputStream());
                for (JsonElement element : array) {
                    JsonObject card = (JsonObject) element;

                    String chapter = string(card, "chapter");
                    String topic = string(card, "topic");
                    String description = string(card, "description");
                    if (description == null)
                        continue;
                    String textOnly = Jsoup.parse(description).text();
                    textOnly = textOnly.replaceAll("\\\\display\\\\", "");
                    String url =  "https://kmap.eu/app/browser/" + URLs.encode(subject) + "/" + URLs.encode(chapter) + "/" + URLs.encode(topic);
                    JsonObject line = new JsonObject();
                    line.addProperty("text", textOnly);
                    line.addProperty("metadata", url);
                    out.write(line.toString());
                    out.write("\n");
                }
                out.flush();
            }
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
}
