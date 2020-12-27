package kmap;

import com.google.gson.JsonArray;
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
public class EditServlet
    extends JsonServlet
{
    private Couch couch;

    Map<String, Upload> uploads = Collections.synchronizedMap(new HashMap<>());

    @Override
    public void init() throws ServletException {
        super.init();
        couch = new Couch(properties);
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) {
        try {
            Server.CLIENT.set(extractClient(req));

            if (authentication.handle(req, resp)) {
                String subject = req.getParameter("subject");
                String save = req.getParameter("save");
                String upload = req.getParameter("upload");
                if (save != null) {
                    authentication.checkRole(req, "teacher");
                    log("save topic = " + save);
                    String json = IOUtils.toString(new InputStreamReader(req.getInputStream(), StandardCharsets.UTF_8));
                    String command = couch.storeTopic(subject, save, json, uploads);
                    if (command.startsWith("error:"))
                        sendError(req, resp, HttpServletResponse.SC_PRECONDITION_FAILED, command.substring("error:".length()));
                    else
                        writeResponse(req, resp, new JsonPrimitive(command));

                    uploads.clear();
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
            String modules = req.getParameter("modules");
            String subject = req.getParameter("subject");
            String load = req.getParameter("load");
            if (modules != null) {
                log("modules = " + modules);
                JsonArray array = couch.loadModules();
                if (array != null)
                    writeResponse(req, resp, array);
            }
            else if (load != null) {
                log("load chapter = " + load);
                JsonArray array = couch.loadModule(subject, load);
                if (array != null)
                    writeResponse(req, resp, array);
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
}
