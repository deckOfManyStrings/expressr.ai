import { NextResponse } from "next/server";
import Replicate from "replicate";

const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
});

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get("image") as File;

        if (!file) {
            return NextResponse.json({ error: "No image provided" }, { status: 400 });
        }

        // Convert file to base64 data URI
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const mimeType = file.type || "image/jpeg";
        const dataUri = `data:${mimeType};base64,${buffer.toString("base64")}`;

        // Run face detection
        // Model: chigozienri/mediapipe-face
        const output = await replicate.run(
            "chigozienri/mediapipe-face:b52b4833a810a8b8d835d6339b72536d63590918b185588be2def78a89e7ca7b",
            {
                input: {
                    images: dataUri,
                    max_faces: 10,
                    min_confidence: 0.5
                }
            }
        );

        // Output is generally an array of detected faces or JSON with detections
        // Based on model docs, it usually returns an array of objects or similar.
        // We check if we got valid faces back.

        // For this specific model, let's assume it returns a list of faces.
        // If output is null or empty array -> 0 faces.
        const faces = Array.isArray(output) ? output : [];

        // We only want photos with exactly ONE face for training (usually)
        // But for initial validation, maybe at least one?
        // User goal: "Generate 12 professional expressions of YOUR face".
        // Usually single subject is best.

        const faceCount = faces.length;
        const isValid = faceCount === 1;
        let error = undefined;

        if (faceCount === 0) error = "No face detected";
        else if (faceCount > 1) error = "Multiple faces detected";

        return NextResponse.json({
            isValid,
            faceCount,
            error
        });

    } catch (error: any) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        console.error("Validation failed details:", error);

        // Check if it's a rate limit error (429)
        const isRateLimit = errorMessage.includes("429") || errorMessage.includes("Too Many Requests");
        const status = isRateLimit ? 429 : 500;

        return NextResponse.json(
            {
                error: errorMessage,
                // Attempt to extract retry info if available in the error string
                retry_after: isRateLimit ? 5 : undefined // Default to 5s if we can't parse it easily
            },
            { status }
        );
    }
}
