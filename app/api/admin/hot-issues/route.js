import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const getSecret = () => new TextEncoder().encode(process.env.JWT_SECRET || "fallback_secret_if_not_set");

// Helper to check auth
const isAuthenticated = async (request) => {
  const token = request.cookies.get('admin_token');
  if (!token) return false;
  try {
    await jwtVerify(token.value, getSecret());
    return true;
  } catch (e) {
    return false;
  }
};

export async function GET() {
  try {
    const hotIssues = await prisma.hotIssue.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(hotIssues);
  } catch (error) {
    return NextResponse.json([]);
  }
}

export async function POST(request) {
  if (!(await isAuthenticated(request))) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await request.json();
    const newIssue = await prisma.hotIssue.create({
      data: {
        title: data.title,
        department: data.department,
        showDepartment: data.showDepartment,
        contact: data.contact,
        showContact: data.showContact,
        target: data.target,
        showTarget: data.showTarget,
        description: data.description,
        showDescription: data.showDescription,
        content: data.content,
        showContent: data.showContent,
        howToApply: data.howToApply,
        showHowToApply: data.showHowToApply,
        category: data.category,
        endDate: data.endDate,
        showEndDate: data.showEndDate,
        isVisible: data.isVisible,
        url: data.url,
        isHot: true
      }
    });
    return NextResponse.json({ success: true, data: newIssue });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Failed to add' }, { status: 500 });
  }
}

export async function PUT(request) {
  if (!(await isAuthenticated(request))) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await request.json();
    if (!data.id) return NextResponse.json({ success: false, message: 'ID required' }, { status: 400 });

    const updatedIssue = await prisma.hotIssue.update({
      where: { id: data.id },
      data: {
        title: data.title,
        department: data.department,
        showDepartment: data.showDepartment,
        contact: data.contact,
        showContact: data.showContact,
        target: data.target,
        showTarget: data.showTarget,
        description: data.description,
        showDescription: data.showDescription,
        content: data.content,
        showContent: data.showContent,
        howToApply: data.howToApply,
        showHowToApply: data.showHowToApply,
        category: data.category,
        endDate: data.endDate,
        showEndDate: data.showEndDate,
        isVisible: data.isVisible,
        url: data.url,
        isHot: true
      }
    });
    return NextResponse.json({ success: true, data: updatedIssue });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Failed to update' }, { status: 500 });
  }
}

export async function DELETE(request) {
  if (!(await isAuthenticated(request))) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) return NextResponse.json({ success: false, message: 'ID required' }, { status: 400 });

    await prisma.hotIssue.delete({
      where: { id: id }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Failed to delete' }, { status: 500 });
  }
}
