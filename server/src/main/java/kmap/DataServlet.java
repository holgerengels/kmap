package kmap;


import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import org.apache.commons.io.IOUtils;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Arrays;

/**
 * Created by holger on 09.05.16.
 */

public class DataServlet
    extends JsonServlet
{
    private Couch couch;
    private Cloud cloud;

    @Override
    public void init() throws ServletException {
        super.init();
        couch = new Couch(properties);
        cloud = new Cloud(properties);
    }

    protected void doGet(HttpServletRequest req, HttpServletResponse resp) {
        try {
            Server.CLIENT.set(extractClient(req));
            String subjects = req.getParameter("subjects");
            String subject = req.getParameter("subject");
            String load = req.getParameter("load");
            String search = req.getParameter("search");
            String dependencies = req.getParameter("dependencies");
            String tree = req.getParameter("tree");
            String chapters = req.getParameter("chapters");
            String topics = req.getParameter("topics");
            String file = req.getPathInfo();
            if (subjects != null) {
                log("subjects");
                JsonArray result = couch.loadSubjects();
                if (result != null)
                    writeObject(req, resp, result.toString());
            }
            else if (load != null) {
                log("load " + subject + " - " + load);
                JsonObject board = couch.chapter(subject, load);
                if (board != null)
                    writeObject(req, resp, board.toString());
            }
            else if (search != null) {
                log("search = " + search);
                JsonArray result = couch.search(search);
                if (result != null)
                    writeObject(req, resp, result.toString());
            }
            else if (dependencies != null) {
                log("dependencies = " + dependencies);
                JsonObject result = couch.dependencies(subject);
                if (result != null)
                    writeObject(req, resp, result.toString());
            }
            else if (tree != null) {
                log("tree = " + tree);
                JsonArray result = couch.tree(subject);
                if (result != null)
                    writeObject(req, resp, result.toString());
            }
            else if (chapters != null) {
                log("chapters = " + chapters);
                JsonArray result = couch.chapters(subject);
                if (result != null)
                    writeObject(req, resp, result.toString());
            }
            else if (topics != null) {
                log("topics = " + topics);
                JsonArray result = "all".equals(topics) ? couch.topics(subject) : couch.topics(subject, topics);
                if (result != null)
                    writeObject(req, resp, result.toString());
            }
            else if (file != null) {
                log("load file = " + file);
                String[] split = file.split("/");
                String[] dirs = Arrays.copyOfRange(split, 1, split.length);

                corsHeaders(req, resp);

                if (!couch.loadAttachment(attachment -> {
                    sendAttachment(resp, attachment);
                }, dirs)) {
                    cloud.loadAttachment(attachment -> {
                        if (attachment.responseCode == 200) {
                            sendAttachment(resp, attachment);
                        }
                        else
                            sendError(req, resp, attachment.responseCode, attachment.responseMessage);
                    }, dirs);
                }
            }
        }
        catch (Exception e) {
            e.printStackTrace();
            sendError(req, resp, e);
        }
        finally {
            Server.CLIENT.remove();
        }
    }

    private void sendAttachment(HttpServletResponse resp, Cloud.AttachmentInputStream attachment) {
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
            e.printStackTrace();
            throw new RuntimeException(e);
        }
    }

    @Deprecated
    protected void writeObject(HttpServletRequest request, HttpServletResponse resp, String node) throws IOException {
        resp.setContentType("application/json");
        resp.setCharacterEncoding("utf-8");
        corsHeaders(request, resp);
        resp.getWriter().print(node);
    }
}
