package kmap;


import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import org.apache.commons.io.IOUtils;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.util.Arrays;

/**
 * Created by holger on 09.05.16.
 */

public class DataServlet
    extends JsonServlet
{
    private Couch couch;

    @Override
    public void init() throws ServletException {
        super.init();
        couch = new Couch(properties);
    }

    protected void doGet(HttpServletRequest req, HttpServletResponse resp) {
        try {
            Server.CLIENT.set(extractClient(req));

            req.setCharacterEncoding("UTF-8");
            String subjects = req.getParameter("subjects");
            String subject = req.getParameter("subject");
            String load = req.getParameter("load");
            String search = req.getParameter("search");
            String dependencies = req.getParameter("dependencies");
            String tree = req.getParameter("tree");
            String chapters = req.getParameter("chapters");
            String topics = req.getParameter("topics");
            String latest = req.getParameter("latest");
            String number = req.getParameter("number");
            String file = req.getPathInfo();
            String chapter = req.getParameter("chapter");
            String topic = req.getParameter("topic");
            if (subjects != null) {
                log("subjects");
                JsonArray result = couch.loadSubjects();
                if (result != null)
                    writeResponse(req, resp, result);
            }
            else if (load != null) {
                log("load " + subject + " - " + load);
                JsonObject board = couch.chapter(subject, load);
                if (board != null)
                    writeResponse(req, resp, board);
            }
            else if (search != null) {
                log("search = " + search);
                JsonArray result = couch.search(search);
                if (result != null)
                    writeResponse(req, resp, result);
            }
            else if (dependencies != null) {
                log("dependencies = " + dependencies);
                JsonObject result = couch.dependencies(subject);
                if (result != null)
                    writeResponse(req, resp, result);
            }
            else if (tree != null) {
                log("tree = " + tree);
                JsonArray result = couch.tree(subject);
                if (result != null)
                    writeResponse(req, resp, result);
            }
            else if (chapters != null) {
                log("chapters = " + chapters);
                JsonArray result = couch.chapters(subject);
                if (result != null)
                    writeResponse(req, resp, result);
            }
            else if (topics != null) {
                log("topics = " + topics);
                JsonArray result = "all".equals(topics) ? couch.topics(subject) : couch.topics(subject, topics);
                if (result != null)
                    writeResponse(req, resp, result);
            }
            else if (latest != null) {
                int n = number != null ? Integer.parseInt(number) : 3;
                log("latest = " + latest + " " + n);
                JsonArray result = couch.latest(latest, n, false);
                if (result != null)
                    writeResponse(req, resp, result);
            }
            else if (file != null) {
                log("load file = " + file);
                String[] split = file.split("/");
                String[] dirs = Arrays.copyOfRange(split, 1, split.length);

                corsHeaders(req, resp);

                couch.loadAttachment(attachment -> {
                    sendAttachment(resp, attachment);
                }, dirs);
            }
            else if (topic != null) {
                log("load topic = " + topic);
                JsonObject card = couch.loadTopic(subject, chapter, topic);
                if (card != null)
                    writeResponse(req, resp, card);
            }
        }
        catch (Exception e) {
            String referrer = req.getHeader("referer");
            if (referrer != null)
                System.err.println(referrer);
            e.printStackTrace(System.err);
            sendError(req, resp, e);
        }
        finally {
            Server.CLIENT.remove();
        }
    }

    private void sendAttachment(HttpServletResponse resp, AttachmentInputStream attachment) {
        String fileName = attachment.fileName;
        String mimeType = attachment.mimeType != null ? attachment.mimeType : MimeTypes.guessType(fileName);
        resp.setContentType(mimeType);
        resp.setContentLength((int) attachment.contentLength);
        if (!"text/html".equals(mimeType))
            resp.setHeader("Content-Disposition", "attachment; filename=\"" + fileName + "\"");
        resp.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
        resp.setHeader("Expires", "0");
        resp.setHeader("Pragma", "no-cache");
        try {
            long millis = System.currentTimeMillis();
            IOUtils.copy(attachment.stream, resp.getOutputStream());
            resp.getOutputStream().flush();
            System.out.println("millis = " + (System.currentTimeMillis() - millis));
        }
        catch (Exception e) {
            e.printStackTrace(System.err);
            throw new RuntimeException(e);
        }
    }
}
