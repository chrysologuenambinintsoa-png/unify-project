/**
 * Exemple d'API route sécurisée avec validation et protection
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { 
  rateLimitMiddleware, 
  validateInput, 
  securityHeadersMiddleware 
} from '@/lib/api-security';
import { sanitizeInput, validateEmail } from '@/lib/security';

// POST /api/example
export async function POST(req: NextRequest) {
  try {
    // 1. Rate limiting
    const rateLimitError = rateLimitMiddleware(100, 15 * 60 * 1000)(req);
    if (rateLimitError) {
      return rateLimitError;
    }

    // 2. Vérifier l'authentification
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    // 3. Parser et valider le body
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: 'JSON invalide' },
        { status: 400 }
      );
    }

    // 4. Valider les inputs
    const validation = validateInput(body, {
      email: { required: true, type: 'email' },
      message: { 
        required: true, 
        type: 'string', 
        minLength: 1, 
        maxLength: 1000 
      },
      name: { 
        required: true, 
        type: 'string', 
        minLength: 2, 
        maxLength: 50 
      }
    });

    if (!validation.isValid) {
      return NextResponse.json(
        { error: 'Validation échouée', details: validation.errors },
        { status: 400 }
      );
    }

    // 5. Nettoyer les inputs
    const sanitizedData = {
      email: sanitizeInput(body.email),
      message: sanitizeInput(body.message),
      name: sanitizeInput(body.name)
    };

    // 6. Valider l'email
    if (!validateEmail(sanitizedData.email)) {
      return NextResponse.json(
        { error: 'Email invalide' },
        { status: 400 }
      );
    }

    // 7. Effectuer l'action (exemple: sauvegarder en BD)
    // const result = await prisma.example.create({ data: sanitizedData });

    // 8. Préparer la réponse
    const response = NextResponse.json(
      { 
        success: true,
        data: {
          id: '123',
          ...sanitizedData
        }
      },
      { status: 201 }
    );

    // 9. Ajouter les en-têtes de sécurité
    return securityHeadersMiddleware(response);

  } catch (error) {
    console.error('API Error:', error);
    
    // Ne pas révéler les détails d'erreur en production
    const isDev = process.env.NODE_ENV === 'development';
    
    return NextResponse.json(
      { 
        error: 'Erreur serveur',
        ...(isDev && { details: String(error) })
      },
      { status: 500 }
    );
  }
}

// Options de méthode non autorisées
export async function GET() {
  return NextResponse.json(
    { error: 'Méthode non autorisée' },
    { status: 405 }
  );
}
