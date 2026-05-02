import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Missing email or password' },
        { status: 400 }
      );
    }

    // TODO: Find user in database
    // TODO: Compare password with bcryptjs
    // TODO: Create session/JWT token
    // const user = await prisma.user.findUnique({
    //   where: { email },
    // });

    return NextResponse.json(
      { message: 'Login successful' },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}
