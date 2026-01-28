import { NextResponse } from "next/server";
import Replicate from "replicate";

const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
});

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const image = formData.get("image") as File;

        if (!image) {
            return NextResponse.json(
                { error: "No image provided" },
                { status: 400 }
            );
        }

        // Convert to base64
        const bytes = await image.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64 = buffer.toString('base64');
        const dataUri = `data:${image.type};base64,${base64}`;

        // Call Replicate face detection
        const output = await replicate.run(
            "andreasjansson/face-detection:7a4ee6c0f3f9a8e6f0f8e3f9a8e6f0f8e3f9a8e6f0f8e3f9a8e6f0f8e3f9a8e6",
            {
                input: {
                    image: dataUri
                }
            }
        ) as any;

        // Check if face detected
        const isValid = output && output.length > 0;

        return NextResponse.json({
            isValid,
            error: isValid ? null : "No face detected in this photo"
        });

    } catch (error: any) {
        console.error("Face validation error:", error);

        // Handle rate limiting
        if (error.response?.status === 429) {
            return NextResponse.json(
                {
                    error: "Rate limited",
                    retry_after: 5
                },
                { status: 429 }
            );
        }

        return NextResponse.json(
            { error: "Validation failed" },
            { status: 500 }
        );
    }
}
