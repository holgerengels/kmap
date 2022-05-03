package kmap;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;

import java.io.IOException;
import java.io.OutputStreamWriter;
import java.io.Writer;
import java.util.*;

import static kmap.JSON.*;

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
                JsonArray array = couch.latest(subject, 100000, true);

                Writer out = new OutputStreamWriter(resp.getOutputStream());
                for (JsonElement element : array) {
                    JsonObject card = (JsonObject) element;

                    String chapter = string(card, "chapter");
                    String topic = string(card, "topic");
                    String url = "_".equals(topic)
                            ? "https://kmap.eu/app/browser/" + URLs.encode(subject) + "/" + URLs.encode(chapter)
                            : "https://kmap.eu/app/browser/" + URLs.encode(subject) + "/" + URLs.encode(chapter) + "/" + URLs.encode(topic);

                    String summary = stringTrim(card, "summary");
                    String description = string(card, "description");
                    String text = chapter + "\n";
                    if (!"_".equals(topic))
                        text +=  topic + "\n";
                    if (summary != null && summary.length() != 0)
                        text += summary;
                    if (description != null) {
                        text += text.endsWith(".") ? " " : ". ";
                        Document document = Jsoup.parse(description);
                        text += new HtmlToText().getPlainText(document.body()).replaceAll("\\\\display\\\\", "");
                        text = text.replaceAll("\\n{2,100}", "\n");
                        System.out.println("text = " + text);
                    }
                    JsonObject line = new JsonObject();
                    line.addProperty("metadata", url);
                    line.addProperty("text", text);
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
