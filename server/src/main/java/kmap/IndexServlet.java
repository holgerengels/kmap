package kmap;

import com.google.gson.*;
import org.apache.commons.io.IOUtils;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Arrays;

import static kmap.JSON.string;

public class IndexServlet extends JsonServlet {
    private Couch couch;
    private String file;

    @Override
    public void init() throws ServletException {
        super.init();
        couch = new Couch(properties);
    }

    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String title = "KMap";
        String description = "KMap kartographiert Wissen mit Zusammenhang";
        String text = "";

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
                            title = chapter + " - " + topic;
                            card = couch.loadTopic(subject, chapter, topic);
                        }
                        else {
                            title = chapter;
                            card = couch.loadTopic(subject, chapter, "_");
                        }
                        if (card != null) {
                            String cardSummary = string(card, "summary");
                            String cardDescription = string(card, "description");
                            description = cardSummary != null ? cardSummary : description;
                            text = cardDescription != null ? cardDescription : cardSummary;
                        }
                        Server.CLIENT.remove();
                    }
                    else if ("test".equals(page)) {
                        if (path.length == 4) {
                            String topic = path[3];
                            title = "Aufgaben zum Thema " + chapter + " - " + topic;
                        }
                        else {
                            title = "Aufgaben zum Thema " + chapter;
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

        String string = file();
        string = string.replace("<meta ogtitle=\"\">", "<meta property=\"og:title\" content=\"" + title + "\">");
        string = string.replace("<meta ogdescription=\"\">", "<meta property=\"og:description\" content=\"" + description + "\">");

        // if (text == null) text = "";
        // string = string.replace("<ogtext></ogtext>", text);

        newSessionHeader(req, resp);
        corsHeaders(req, resp);
        resp.setContentType("text/html");
        resp.setCharacterEncoding("utf-8");
        resp.getWriter().print(string);
    }

    private synchronized String file() throws IOException {
        if (file == null) {
            Path path = Paths.get(properties.getProperty("kmap.index"));
            file = IOUtils.toString(new InputStreamReader(Files.newInputStream(path), StandardCharsets.UTF_8));
        }
        return file;
    }
}
