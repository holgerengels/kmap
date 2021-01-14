package kmap;

import com.google.gson.*;
import org.apache.commons.io.IOUtils;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.Arrays;
import java.util.Date;
import java.util.Locale;

import static kmap.JSON.string;

public class IndexServlet extends JsonServlet {
    private Couch couch;
    private String file;

    @Override
    public void init() throws ServletException {
        super.init();
        couch = new Couch(properties);
        try {
            Path path = Paths.get(getServletContext().getRealPath(properties.getProperty("kmap.index", "index.html")));
            file = IOUtils.toString(new InputStreamReader(Files.newInputStream(path), StandardCharsets.UTF_8));
        }
        catch (IOException e) {
            throw new ServletException(e);
        }
    }

    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String title = "KMap";
        String description = "KMap kartographiert Wissen mit Zusammenhang";
        String author = "KMap Team";
        String text = "";
        String created = null;
        String modified = null;
        String section = null;
        String keywords = null;

        try {
            Server.CLIENT.set(extractClient(req));

            String pathInfo = req.getPathInfo();
            System.out.println("pathInfo = " + pathInfo);
            if (pathInfo != null) {
                String[] path = pathInfo.substring(1).split("/");
                System.out.println("path = " + Arrays.asList(path));
                String page = path[0];
                if (path.length == 3 || path.length == 4) {
                    String subject = path[1];
                    String chapter = path[2];

                    if ("browser".equals(page)) {
                        JsonObject card;
                        if (path.length == 4) {
                            String topic = path[3];
                            title = subject + " - " + chapter + " - " + topic;
                            card = couch.loadTopic(subject, chapter, topic);
                        }
                        else {
                            title = subject + " - " + chapter;
                            card = couch.loadTopic(subject, chapter, "_");
                        }
                        if (card != null) {
                            String cardSummary = string(card, "summary");
                            String cardDescription = string(card, "description");
                            description = cardSummary != null ? cardSummary : description;
                            text = cardDescription != null ? cardDescription : cardSummary;
                            author = string(card, "author");
                            created = date(card, "created");
                            modified = date(card, "modified");
                            section = title;
                            keywords = string(card, "keywords");
                        }
                        Server.CLIENT.remove();
                    }
                    else if ("test".equals(page)) {
                        if (path.length == 4) {
                            String topic = path[3];
                            title = "Aufgaben zum Thema " + subject + " - " + chapter + " - " + topic;
                        }
                        else {
                            title = "Aufgaben zum Thema " + subject + " - " + chapter;
                        }
                        description = "Ermittle Deinen Wissensstand mit Hilfe von interaktiven Aufgaben!";
                    }
                }
            }
            System.out.println("title = " + title);
            System.out.println("description = " + description);
            //System.out.println("text = " + text);
        }
        catch (Exception e) {
            e.printStackTrace();
            sendError(req, resp, e);
        }
        finally {
            Server.CLIENT.remove();
        }

        String string = file;
        string = string.replace("<title>KMap</title>", "<title>" + title + "</title>");
        string = string.replace("<meta ogtitle=\"\">", "<meta property=\"og:title\" content=\"" + title + "\">");
        string = string.replace("<meta ogdescription=\"\">", "<meta property=\"og:description\" content=\"" + description + "\">");
        string = string.replace("<meta author=\"\">", "<meta name=\"author\" content=\"" + author + "\">");
        StringBuilder builder = new StringBuilder();
        if (created != null)
            builder.append("<meta name=\"article:pulished_time\" content=\"").append(created).append("\">");
        if (modified != null)
            builder.append("<meta name=\"article:modified_time\" content=\"").append(modified).append("\">");
        if (section != null)
            builder.append("<meta name=\"article:section\" content=\"").append(section).append("\">");
        if (keywords != null)
            builder.append("<meta name=\"article:tag\" content=\"").append(keywords).append("\">");
        if (builder.length() > 0) {
            builder.append("<meta name=\"article:author\" content=\"").append(author).append("\">");
            string = string.replace("<meta type=\"\">", "<meta name=\"og:type\" content=\"article\">" + builder.toString());
        }
        else
            string = string.replace("<meta type=\"\">", "<meta name=\"og:type\" content=\"website\">");


        // if (text == null) text = "";
        // string = string.replace("<ogtext></ogtext>", text);

        newSessionHeader(req, resp);
        corsHeaders(req, resp);
        resp.setContentType("text/html");
        resp.setCharacterEncoding("utf-8");
        resp.getWriter().print(string);
    }

    DateFormat format = new SimpleDateFormat("yyyy-MM-dd", Locale.ENGLISH);
    private String date(JsonObject object, String name) {
        JsonPrimitive primitive = object.getAsJsonPrimitive(name);
        return primitive != null ? format.format(new Date(primitive.getAsLong())) : null;
    }
}
