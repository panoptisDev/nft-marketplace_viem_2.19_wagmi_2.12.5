import { NextResponse, NextRequest } from "next/server";
import { pinata } from "@/utils/config";

export async function POST(request: NextRequest) {
  try {
    const data = await request.formData();
    const file: File | null = data.get("file") as unknown as File;
    const name: string = data.get("name");
    const description: string = data.get("description");
    if (!file || !name || !description) {
      return NextResponse.json(
        { error: "Please provide a file" },
        { status: 400 }
      );
    }

    const uploadImage = await pinata.upload.file(file);
    const uploadData = await pinata.upload.json({
      name: name,
      description: description,
      image: uploadImage.IpfsHash,
    });
    // await axios.get(
    //     `https://${process.env.NEXT_PUBLIC_GATEWAY_URL}/ipfs/${uploadData.IpfsHash}`
    // ).then((res)=>{
    //     response=res.data
    // })
    return NextResponse.json(uploadData.IpfsHash, { status: 200 });
  } catch (e) {
    console.log(e);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
