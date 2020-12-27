package kmap;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.google.gson.JsonPrimitive;
import org.apache.commons.io.IOUtils;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.MultipartConfig;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.Part;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

/**
 * Created by holger on 09.05.16.
 */

@MultipartConfig(
        fileSizeThreshold = 1024 * 1024,
        maxFileSize = 1024 * 1024 * 5,
        maxRequestSize = 1024 * 1024 * 5 * 5
)
public class TestsServlet
    extends JsonServlet
{
    private Tests tests;

    Map<String, Upload> uploads = Collections.synchronizedMap(new HashMap<>());

    @Override
    public void init() throws ServletException {
        super.init();
        tests = new Tests(new Couch(properties));
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) {
        try {
            Server.CLIENT.set(extractClient(req));

            if (authentication.handle(req, resp)) {
                String subject = req.getParameter("subject");
                String save = req.getParameter("save");
                String delete = req.getParameter("delete");
                String imp = req.getParameter("import");
                String upload = req.getParameter("upload");
                if (save != null) {
                    authentication.checkRole(req, "teacher");
                    log("save test = " + save);
                    String json = IOUtils.toString(new InputStreamReader(req.getInputStream(), StandardCharsets.UTF_8));
                    String command = tests.storeTest(subject, save, json, uploads);
                    if (command.startsWith("error:"))
                        sendError(req, resp, HttpServletResponse.SC_PRECONDITION_FAILED, command.substring("error:".length()));
                    else
                        writeResponse(req, resp, new JsonPrimitive(command));

                    uploads.clear();
                }
                else if (imp != null) {
                    authentication.checkRole(req, "teacher");
                    log("import set = " + imp);
                    String json = IOUtils.toString(new InputStreamReader(req.getInputStream(), StandardCharsets.UTF_8));
                    JsonObject set = tests.importSet(subject, imp, json);
                    writeResponse(req, resp, set);
                }
                else if (delete != null) {
                    authentication.checkRole(req, "teacher");
                    log("delete set = " + delete);
                    JsonObject set = tests.deleteSet(subject, delete);
                    writeResponse(req, resp, set);
                }
                else if (upload != null) {
                    log("upload file = " + upload);
                    for (Part part : req.getParts()) {
                        String name = getFileName(part);
                        String type = part.getHeader("content-type");
                        Path path = Files.createTempFile("upload", name);
                        IOUtils.copy(part.getInputStream(), Files.newOutputStream(path));
                        uploads.put(name, new Upload(name, type, path));
                        writeResponse(req, resp, new JsonPrimitive(upload));
                    }
                }
            }
        }
        catch (Authentication.AuthException e) {
            sendError(req, resp, HttpServletResponse.SC_FORBIDDEN, e.getMissingRole());
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
            String random = req.getParameter("random");
            String file = req.getPathInfo();
            if (sets != null) {
                log("sets = " + sets);
                JsonArray array = tests.loadSets();
                if (array != null)
                    writeResponse(req, resp, array);
            }
            else if (set != null) {
                log("load set = " + set);
                JsonArray array = tests.loadTestsBySet(subject, set);
                if (array != null)
                    writeResponse(req, resp, array);
            }
            else if (topic != null) { // uses chapter and topic !!!
                log("load topic = " + chapter + " " + topic);
                JsonArray array = tests.loadTestsByTopic(subject, chapter, topic);
                if (array != null)
                    writeResponse(req, resp, array);
            }
            else if (chapter != null) {
                log("load chapter = " + chapter);
                JsonArray array = tests.loadTestsByChapter(subject, chapter);
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
            else if (random != null) {
                log("load random = " + random);
                JsonArray array = tests.loadRandomTests(random);
                if (array != null)
                    writeResponse(req, resp, array);
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

    private String getFileName(Part part) {
        for (String content : part.getHeader("content-disposition").split(";")) {
            if (content.trim().startsWith("filename"))
                return content.substring(content.indexOf("=") + 2, content.length() - 1);
        }
        return "noname";
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
            e.printStackTrace();
            throw new RuntimeException(e);
        }
    }
}
