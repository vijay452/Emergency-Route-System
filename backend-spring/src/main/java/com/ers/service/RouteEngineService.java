package com.ers.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.*;
import java.util.ArrayList;
import java.util.List;
import java.util.Scanner;

@Service
public class RouteEngineService {

    private static final Logger log = LoggerFactory.getLogger(RouteEngineService.class);

    @Value("${ers.core.binary-path}")
    private String binaryPath;

    public String calculateRoute(int startNode, int endNode) {
        try {
            ProcessBuilder processBuilder = new ProcessBuilder(binaryPath);
            processBuilder.redirectErrorStream(true);
            
            Process process = processBuilder.start();

            // Write inputs to standard input of the C++ process
            try (BufferedWriter writer = new BufferedWriter(new OutputStreamWriter(process.getOutputStream()))) {
                writer.write(startNode + " " + endNode);
                writer.newLine();
                writer.flush();
            }

            // Read output
            StringBuilder output = new StringBuilder();
            try (Scanner scanner = new Scanner(process.getInputStream())) {
                while (scanner.hasNextLine()) {
                    output.append(scanner.nextLine()).append("\n");
                }
            }

            int exitCode = process.waitFor();
            if (exitCode != 0) {
                log.error("C++ Engine failed with exit code {}. Output: {}", exitCode, output.toString());
                throw new RuntimeException("Routing Engine failed");
            }

            return output.toString();

        } catch (Exception e) {
            log.error("Failed to execute C++ Route Engine", e);
            throw new RuntimeException("Execution error", e);
        }
    }
}
