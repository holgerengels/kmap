package kmap;

import com.google.gson.JsonElement;
import com.google.gson.JsonObject;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.sql.rowset.serial.SerialException;
import java.io.IOException;
import java.util.Enumeration;
import java.util.Properties;

public class JsonServlet extends HttpServlet {
    //protected final String cors_url = "http://localhost:8080";
    protected Properties properties;
    protected Authentication authentication;

    @Override
    public void init() throws ServletException {
        super.init();
        try {
            properties = new Properties();
            properties.load(getServletContext().getResourceAsStream("/kmap.properties"));
            getServletContext().setAttribute("properties", properties);
            authentication = new Authentication(properties);
        }
        catch (IOException e) {
            throw new ServletException(e);
        }
    }

    @Override
    protected void doOptions(HttpServletRequest request, HttpServletResponse resp)
        throws ServletException, IOException {
        corsHeaders(request, resp);
    }

    protected String getProperty(String key) {
        String value = properties.getProperty(key);
        if (value == null)
            System.err.println("WARNING: Property " + key + " is not configured");
        return value;
    }

    protected void writeResponse(HttpServletRequest request, HttpServletResponse resp, String response, JsonElement element) throws IOException {
        JsonObject object = new JsonObject();
        object.addProperty("response", response);
        object.add("data", element);
        writeObject(request, resp, object);
    }

    protected void writeResponse(HttpServletRequest request, HttpServletResponse resp, String response, String message) throws IOException {
        JsonObject object = new JsonObject();
        object.addProperty("response", response);
        object.addProperty("message", message);
        writeObject(request, resp, object);
    }

    private void writeObject(HttpServletRequest request, HttpServletResponse resp, JsonElement object) throws IOException {
        resp.setContentType("application/json");
        resp.setCharacterEncoding("utf-8");
        corsHeaders(request, resp);
        resp.getWriter().print(object.toString());
    }

    protected void sendError(HttpServletRequest request, HttpServletResponse resp, int code, String message) {
        corsHeaders(request, resp);
        try {
            resp.sendError(code, message);
        }
        catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    static void corsHeaders(HttpServletRequest request, HttpServletResponse resp) {
        Properties properties = (Properties)request.getServletContext().getAttribute("properties");
        if (Boolean.valueOf(properties.getProperty("kmap.cors"))) {
            String referer = request.getHeader("referer");
            if (referer == null || referer.length() == 0)
                throw new RuntimeException("referer header missing");

            int i = referer.indexOf("/", 9);
            if (i != -1)
                referer = referer.substring(0, i);

            System.out.println(referer);

            resp.setHeader("Access-Control-Allow-Origin", referer);
            resp.setHeader("Access-Control-Allow-Credentials", "true");
            resp.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS, HEAD, PUT, POST");
            resp.setHeader("Access-Control-Allow-Headers", "Origin, Accept, Content-Type, X-Requested-With, X-CSRF-Token");
        }
    }

    String extractClient(HttpServletRequest request) {
        String client = request.getHeader("referer");
        if (client == null || client.length() == 0) {
            client = request.getParameter("instance");
        }
        else {
            int start = client.indexOf("/", 9);
            int end = client.indexOf("/", start + 1);
            client = end != -1 ? client.substring(start + 1, end) : "lala";
        }
        System.out.println("client " + client);
        return client;
    }
}
