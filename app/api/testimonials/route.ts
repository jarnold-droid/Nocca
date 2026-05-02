import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { content } = await request.json();

    if (!content || content.length === 0) {
      return NextResponse.json(
        { error: 'Testimonial content is required' },
        { status: 400 }
      );
    }

    if (content.length > 500) {
      return NextResponse.json(
        { error: 'Testimonial must be 500 characters or less' },
        { status: 400 }
      );
    }

    // TODO: Save to database using Prisma
    // const testimonial = await prisma.testimonial.create({
    //   data: {
    //     content,
    //     authorId: session.user.id,
    //   },
    // });

    return NextResponse.json(
      { message: 'Testimonial created successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Failed to create testimonial' },
      { status: 500 }
    );
  }
}
