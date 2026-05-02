import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { title, content } = await request.json();

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // TODO: Save to database using Prisma
    // const story = await prisma.story.create({
    //   data: {
    //     title,
    //     content,
    //     authorId: session.user.id,
    //   },
    // });

    return NextResponse.json(
      { message: 'Story created successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Failed to create story' },
      { status: 500 }
    );
  }
}
