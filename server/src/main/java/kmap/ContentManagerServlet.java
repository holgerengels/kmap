package kmap;


import com.google.gson.JsonArray;

import javax.servlet.ServletException;
import javax.servlet.annotation.MultipartConfig;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.Part;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

/**
 * Created by holger on 09.05.16.
 */

@MultipartConfig(
        fileSizeThreshold = 1024 * 1024,
        maxFileSize = 1024 * 1024 * 5,
        maxRequestSize = 1024 * 1024 * 5 * 5
)
public class ContentManagerServlet
    extends JsonServlet
{
    private ContentManager contentManager;

    @Override
    public void init() throws ServletException {
        super.init();
        contentManager = new ContentManager(properties);
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) {
        try {
            Server.CLIENT.set(extractClient(req));

            if (authentication.handle(req, resp)) {
                String create = req.getParameter("create");
                String drop = req.getParameter("drop");
                String importModule = req.getParameter("import-module");
                String importSet = req.getParameter("import-set");

                if (importModule != null) {
                    authentication.checkRole(req, "teacher");
                    List<String> modules = new ArrayList<>();
                    log("import module " + importModule);
                    for (Part part : req.getParts()) {
                        String name = getFileName(part);
                        System.out.println("name = " + name);
                        String[] strings;
                        strings = contentManager.importModule(part.getInputStream());
                        System.out.println("imported " + String.join(" - ", strings));
                        modules.add(String.join(" - ", strings));
                    }
                    writeResponse(req, resp, "success", modules.toString());
                }
                else if (importSet != null) {
                    authentication.checkRole(req, "teacher");
                    List<String> sets = new ArrayList<>();
                    log("import set " + importSet);
                    for (Part part : req.getParts()) {
                        String name = getFileName(part);
                        System.out.println("name = " + name);
                        String[] strings;
                        strings = contentManager.importSet(part.getInputStream());
                        System.out.println("imported " + String.join(" - ", strings));
                        sets.add(String.join(" - ", strings));
                    }
                    writeResponse(req, resp, "success", sets.toString());
                }
                else if (create != null) {
                    authentication.checkRole(req, "admin");
                    contentManager.createInstance(create);
                    writeResponse(req, resp, "success", create);
                }
                else if (drop != null) {
                    authentication.checkRole(req, "admin");
                    contentManager.dropInstance(drop);
                    writeResponse(req, resp, "success", drop);
                }
            }
        }
        catch (Authentication.AuthException e) {
            sendError(req, resp, HttpServletResponse.SC_FORBIDDEN, e.getMessage());
        }
        catch (Exception e) {
            e.printStackTrace();
            sendError(req, resp, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, e.getMessage());
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

    protected void doGet(HttpServletRequest req, HttpServletResponse resp) {
        try {
            Server.CLIENT.set(extractClient(req));

            req.setCharacterEncoding("UTF-8");
            String instances = req.getParameter("instances");
            String subject = req.getParameter("subject");
            String exportModule = req.getParameter("export-module");
            String exportSet = req.getParameter("export-set");
            if (instances != null) {
                JsonArray result = contentManager.instances();
                if (result != null)
                    writeObject(req, resp, result.toString());
            }
            else if (exportModule != null) {
                log("export module " + subject + " - " + exportModule);
                resp.setContentType("application/zip");
                corsHeaders(req, resp);
                contentManager.exportModule(subject, exportModule, resp.getOutputStream());
            }
            else if (exportSet != null) {
                log("export set " + subject + " - " + exportSet);
                resp.setContentType("application/zip");
                corsHeaders(req, resp);
                contentManager.exportSet(subject, exportSet, resp.getOutputStream());
            }
        }
        catch (Exception e) {
            e.printStackTrace();
            sendError(req, resp, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, e.getMessage());
        }
        finally {
            Server.CLIENT.remove();
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
