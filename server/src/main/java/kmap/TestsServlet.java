package kmap;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.google.gson.JsonPrimitive;
import org.apache.commons.io.IOUtils;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.List;

/**
 * Created by holger on 09.05.16.
 */
public class TestsServlet
    extends JsonServlet
{
    private Tests tests;
    private Cloud cloud;

    @Override
    public void init() throws ServletException {
        super.init();
        tests = new Tests(new Couch(properties));
        cloud = new Cloud(properties);
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) {
        try {
            Server.CLIENT.set(extractClient(req));
            if (authentication.handle(req, resp)) {
                String subject = req.getParameter("subject");
                String save = req.getParameter("save");
                String imp = req.getParameter("import");
                String delete = req.getParameter("delete");
                if (save != null) {
                    log("save test = " + save);
                    String json = IOUtils.toString(new InputStreamReader(req.getInputStream(), StandardCharsets.UTF_8));
                    String command = tests.storeTest(subject, save, json);
                    if (command.startsWith("error:"))
                        sendError(req, resp, HttpServletResponse.SC_PRECONDITION_FAILED, command.substring("error:".length()));
                    else
                        writeResponse(req, resp, new JsonPrimitive(command));
                }
                else if (imp != null) {
                    log("import set = " + imp);
                    String json = IOUtils.toString(new InputStreamReader(req.getInputStream(), StandardCharsets.UTF_8));
                    JsonObject set = tests.importSet(subject, imp, json);
                    writeResponse(req, resp, set);
                }
                else if (delete != null) {
                    log("delete set = " + delete);
                    JsonObject set = tests.deleteSet(subject, delete);
                    writeResponse(req, resp, set);
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

    protected void doGet(HttpServletRequest req, HttpServletResponse resp) {
        try {
            Server.CLIENT.set(extractClient(req));
            req.setCharacterEncoding("UTF-8");
            String sets = req.getParameter("sets");
            String subject = req.getParameter("subject");
            String set = req.getParameter("set");
            String chapter = req.getParameter("chapter");
            String topic = req.getParameter("topic");
            String chapters = req.getParameter("chapters");
            String topics = req.getParameter("topics");
            String directory = req.getParameter("directory");
            String attachments = req.getParameter("attachments");
            String file = req.getPathInfo();
            if (sets != null) {
                log("sets = " + sets);
                JsonArray array = tests.loadSets();
                if (array != null)
                    writeResponse(req, resp, array);
            }
            else if (set != null) {
                log("load set = " + set);
                JsonArray array = tests.loadSet(subject, set);
                if (array != null)
                    writeResponse(req, resp, array);
            }
            else if (topic != null) { // uses chapter and topic !!!
                log("load topic = " + chapter + " " + topic);
                JsonArray array = tests.loadTopic(subject, chapter, topic);
                if (array != null)
                    writeResponse(req, resp, array);
            }
            else if (chapter != null) {
                log("load chapter = " + chapter);
                JsonArray array = tests.loadChapter(subject, chapter);
                if (array != null)
                    writeResponse(req, resp, array);
            }
            else if (chapters != null) {
                log("available chapters = " + subject);
                JsonArray array = tests.loadChapters(subject);
                if (array != null)
                    writeResponse(req, resp, array);
            }
            else if (topics != null) {
                log("available topics = " + subject);
                JsonArray array = tests.loadTopics(subject);
                if (array != null)
                    writeResponse(req, resp, array);
            }
            else if (directory != null) { // TODO: move to POST
                log("directory for = " + directory);
                String[] split = directory.split("/");
                String link = cloud.createDirectory(split[0], split[1], split[2], "tests");
                writeResponse(req, resp, new JsonPrimitive(link));
            }
            else if (attachments != null) {
                log("attachments for = " + attachments);
                String[] split = attachments.split("/");
                List<Cloud.Attachment> list = cloud.findAttachments(split[0], split[1], split[2], true);
                if (list != null) {
                    JsonArray array = new JsonArray();
                    for (Cloud.Attachment attachment : list) {
                        JsonObject object = new JsonObject();
                        object.addProperty("name", attachment.name);
                        object.addProperty("tag", attachment.tag);
                        object.addProperty("type", attachment.type);
                        array.add(object);
                    }
                    writeResponse(req, resp, array);
                }
            }
            else if (file != null) {
                log("load file = " + file);
                String[] split = file.split("/");
                String[] dirs = Arrays.copyOfRange(split, 1, split.length);

                corsHeaders(req, resp);

                tests.loadAttachment(attachment -> {
                    sendAttachment(resp, attachment);
                }, dirs);
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
}
