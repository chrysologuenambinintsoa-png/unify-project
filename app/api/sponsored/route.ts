import { NextRequest, NextResponse } from 'next/server';

// Données de test pour les annonces sponsorisées
const SPONSORED_POSTS_DATA = [
  {
    id: 'sponsor-1',
    title: 'Découvrez notre plateforme premium',
    description: 'Rejoignez des milliers d\'utilisateurs',
    content: 'Accédez à des fonctionnalités exclusives et améliorez votre expérience sociale.',
    image: 'https://images.unsplash.com/photo-1460925895917-adf4e565db18?w=500&h=300&fit=crop',
    link: 'https://example.com/premium',
    advertiser: 'Unify Premium',
    budget: 500,
    spent: 125,
    impressions: 2500,
    clicks: 150,
    conversions: 12,
    status: 'active',
    startDate: new Date('2025-01-01'),
    endDate: new Date('2026-12-31'),
  },
  {
    id: 'sponsor-2',
    title: 'Augmentez votre visibilité en ligne',
    description: 'Marketing digital pour les petites entreprises',
    content: 'Nos outils vous aident à atteindre votre audience cible efficacement.',
    image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=500&h=300&fit=crop',
    link: 'https://example.com/marketing',
    advertiser: 'Digital Boost',
    budget: 300,
    spent: 75,
    impressions: 1800,
    clicks: 90,
    conversions: 8,
    status: 'active',
    startDate: new Date('2025-01-15'),
    endDate: new Date('2026-06-30'),
  },
  {
    id: 'sponsor-3',
    title: 'Formations en ligne gratuites',
    description: 'Améliorez vos compétences technologiques',
    content: 'Accédez à notre catalogue de cours et certifications professionnelles.',
    image: 'https://images.unsplash.com/photo-1554224311-beee415c15a9?w=500&h=300&fit=crop',
    link: 'https://example.com/courses',
    advertiser: 'Tech Academy',
    budget: 400,
    spent: 200,
    impressions: 3200,
    clicks: 320,
    conversions: 25,
    status: 'active',
    startDate: new Date('2025-02-01'),
    endDate: new Date('2026-08-31'),
  },
  {
    id: 'sponsor-4',
    title: 'Solutions cloud pour votre entreprise',
    description: 'Infrastructure sécurisée et scalable',
    content: 'Migrez vers le cloud avec nos services de support professionnel.',
    image: 'https://images.unsplash.com/photo-1516542152519-87d7f5d5e7f4?w=500&h=300&fit=crop',
    link: 'https://example.com/cloud',
    advertiser: 'CloudSoft Solutions',
    budget: 600,
    spent: 350,
    impressions: 4100,
    clicks: 410,
    conversions: 35,
    status: 'active',
    startDate: new Date('2025-01-20'),
    endDate: new Date('2026-07-20'),
  },
  {
    id: 'sponsor-5',
    title: 'E-commerce intégré simplifié',
    description: 'Lancez votre boutique en ligne facilement',
    content: 'Créez une boutique professionnelle sans compétences techniques requises.',
    image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=500&h=300&fit=crop',
    link: 'https://example.com/shop',
    advertiser: 'ShopHub Pro',
    budget: 450,
    spent: 180,
    impressions: 2900,
    clicks: 200,
    conversions: 18,
    status: 'active',
    startDate: new Date('2025-02-10'),
    endDate: new Date('2026-09-10'),
  },
];

// GET /api/sponsored - Get active sponsored posts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '5'), 20);
    const offset = parseInt(searchParams.get('offset') || '0');

    const now = new Date();

    // Filter active sponsored posts
    const sponsoredPosts = SPONSORED_POSTS_DATA.filter(
      (post) =>
        post.status === 'active' &&
        post.startDate <= now &&
        post.endDate >= now
    )
      .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
      .slice(offset, offset + limit);

    return NextResponse.json(sponsoredPosts);
  } catch (error) {
    console.error('Error fetching sponsored posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sponsored posts' },
      { status: 500 }
    );
  }
}

// POST /api/sponsored - Create a new sponsored post (admin only)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      description,
      content,
      image,
      link,
      advertiser,
      budget,
      startDate,
      endDate,
    } = body;

    // Validation
    if (!title || !description || !content || !advertiser || !budget) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create a new sponsored post object
    const newSponsoredPost = {
      id: `sponsor-${Date.now()}`,
      title,
      description,
      content,
      image,
      link,
      advertiser,
      budget,
      spent: 0,
      impressions: 0,
      clicks: 0,
      conversions: 0,
      status: 'active',
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    };

    // In a real app, this would be saved to the database
    // For now, we're just returning the created post
    return NextResponse.json(newSponsoredPost, { status: 201 });
  } catch (error) {
    console.error('Error creating sponsored post:', error);
    return NextResponse.json(
      { error: 'Failed to create sponsored post' },
      { status: 500 }
    );
  }
}
