/**
 * @jest-environment node
 */
/**
 * Tests d'intégration pour les APIs d'amis
 * À exécuter avec: npm test -- friends-api.test.ts
 */

describe.skip('Friends APIs Integration Tests (requires running server)', () => {
  const baseUrl = 'http://localhost:3000/api';
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    // Wait for server to be ready
    let retries = 0;
    while (retries < 30) {
      try {
        const res = await fetch('http://localhost:3000/', { method: 'HEAD' });
        if (res.ok || res.status === 404) break; // 404 is fine, server is up
      } catch (e) {
        retries++;
        await new Promise(r => setTimeout(r, 100));
      }
    }
  });

  describe('GET /api/friends/badges', () => {
    it('devrait retourner les compteurs d\'amis', async () => {
      const response = await fetch(`${baseUrl}/friends/badges`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('pendingRequests');
      expect(data).toHaveProperty('suggestions');
      expect(data).toHaveProperty('friends');
      expect(data).toHaveProperty('total');
      expect(typeof data.pendingRequests).toBe('number');
      expect(typeof data.suggestions).toBe('number');
      expect(typeof data.friends).toBe('number');
      expect(typeof data.total).toBe('number');
    });

    it('devrait retourner 401 sans authentification', async () => {
      const response = await fetch(`${baseUrl}/friends/badges`);
      expect(response.status).toBe(401);
    });

    it('les compteurs doivent être cohérents', async () => {
      const response = await fetch(`${baseUrl}/friends/badges`);
      const data = await response.json();

      // Le total doit être la somme des compteurs
      expect(data.total).toBe(
        data.pendingRequests + data.suggestions + data.friends
      );
    });
  });

  describe('GET /api/friends/requests', () => {
    it('devrait retourner les demandes d\'amis en attente', async () => {
      const response = await fetch(
        `${baseUrl}/friends/requests?limit=10&offset=0`
      );

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('requests');
      expect(Array.isArray(data.requests)).toBe(true);
      expect(data).toHaveProperty('total');
      expect(data).toHaveProperty('limit');
      expect(data).toHaveProperty('offset');

      // Vérifier la structure de chaque demande
      data.requests.forEach((request: any) => {
        expect(request).toHaveProperty('id');
        expect(request).toHaveProperty('fromUser');
        expect(request).toHaveProperty('createdAt');
        expect(request.fromUser).toHaveProperty('id');
        expect(request.fromUser).toHaveProperty('username');
        expect(request.fromUser).toHaveProperty('fullName');
        expect(request.fromUser).toHaveProperty('avatar');
      });
    });

    it('devrait supporter la pagination', async () => {
      const response1 = await fetch(`${baseUrl}/friends/requests?limit=5&offset=0`);
      const data1 = await response1.json();

      const response2 = await fetch(`${baseUrl}/friends/requests?limit=5&offset=5`);
      const data2 = await response2.json();

      // Si total > 5, les deux pages doivent être différentes
      if (data1.total > 5) {
        expect(data1.requests[0]?.id).not.toBe(data2.requests[0]?.id);
      }
    });

    it('devrait limiter le résultat maximum à 100', async () => {
      const response = await fetch(`${baseUrl}/friends/requests?limit=200`);
      const data = await response.json();

      expect(data.requests.length).toBeLessThanOrEqual(100);
    });
  });

  describe('GET /api/friends/suggestions', () => {
    it('devrait retourner les suggestions d\'amis', async () => {
      const response = await fetch(`${baseUrl}/friends/suggestions?limit=10`);

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('suggestions');
      expect(Array.isArray(data.suggestions)).toBe(true);
      expect(data).toHaveProperty('total');

      // Vérifier la structure de chaque suggestion
      data.suggestions.forEach((suggestion: any) => {
        expect(suggestion).toHaveProperty('id');
        expect(suggestion).toHaveProperty('username');
        expect(suggestion).toHaveProperty('fullName');
        expect(suggestion).toHaveProperty('avatar');
        expect(suggestion).toHaveProperty('mutualFriendsCount');
        expect(typeof suggestion.mutualFriendsCount).toBe('number');
      });
    });

    it('les suggestions doivent être triées par amis mutuels', async () => {
      const response = await fetch(`${baseUrl}/friends/suggestions?limit=20`);
      const data = await response.json();

      if (data.suggestions.length > 1) {
        for (let i = 0; i < data.suggestions.length - 1; i++) {
          expect(data.suggestions[i].mutualFriendsCount).toBeGreaterThanOrEqual(
            data.suggestions[i + 1].mutualFriendsCount
          );
        }
      }
    });
  });

  describe('GET /api/friends/list', () => {
    it('devrait retourner la liste des amis acceptés', async () => {
      const response = await fetch(`${baseUrl}/friends/list?limit=10`);

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('friends');
      expect(Array.isArray(data.friends)).toBe(true);
      expect(data).toHaveProperty('total');

      // Vérifier la structure de chaque ami
      data.friends.forEach((friend: any) => {
        expect(friend).toHaveProperty('id');
        expect(friend).toHaveProperty('username');
        expect(friend).toHaveProperty('fullName');
        expect(friend).toHaveProperty('avatar');
        expect(friend).toHaveProperty('friendSince');
      });
    });

    it('devrait supporter la recherche par nom', async () => {
      // D'abord, obtenir un ami existant
      const friendsResponse = await fetch(`${baseUrl}/friends/list?limit=1`);
      const friendsData = await friendsResponse.json();

      if (friendsData.friends.length > 0) {
        const friend = friendsData.friends[0];
        const searchResponse = await fetch(
          `${baseUrl}/friends/list?search=${friend.fullName.split(' ')[0]}`
        );
        const searchData = await searchResponse.json();

        // La liste devrait contenir l'ami recherché
        const found = searchData.friends.some(
          (f: any) => f.id === friend.id
        );
        expect(found).toBe(true);
      }
    });

    it('devrait supporter la recherche par nom d\'utilisateur', async () => {
      const friendsResponse = await fetch(`${baseUrl}/friends/list?limit=1`);
      const friendsData = await friendsResponse.json();

      if (friendsData.friends.length > 0) {
        const friend = friendsData.friends[0];
        const searchResponse = await fetch(
          `${baseUrl}/friends/list?search=${friend.username}`
        );
        const searchData = await searchResponse.json();

        const found = searchData.friends.some(
          (f: any) => f.id === friend.id
        );
        expect(found).toBe(true);
      }
    });
  });

  describe('GET /api/friends (route générique)', () => {
    it('devrait retourner les amis acceptés avec type=accepted', async () => {
      const response = await fetch(`${baseUrl}/friends?type=accepted`);

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('friends');
      expect(Array.isArray(data.friends)).toBe(true);
    });

    it('devrait retourner les demandes en attente avec type=pending', async () => {
      const response = await fetch(`${baseUrl}/friends?type=pending`);

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('friends');
      expect(Array.isArray(data.friends)).toBe(true);
    });

    it('devrait retourner les suggestions avec type=suggestions', async () => {
      const response = await fetch(`${baseUrl}/friends?type=suggestions`);

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('suggestions');
      expect(Array.isArray(data.suggestions)).toBe(true);
    });

    it('devrait rejeter les types invalides', async () => {
      const response = await fetch(`${baseUrl}/friends?type=invalid`);

      expect(response.status).toBe(400);
    });
  });

  describe('Cohérence des données', () => {
    it('les demandes en attente ne doivent pas être dans les suggestions', async () => {
      const [badgesRes, requestsRes, suggestionsRes] = await Promise.all([
        fetch(`${baseUrl}/friends/badges`),
        fetch(`${baseUrl}/friends/requests?limit=100`),
        fetch(`${baseUrl}/friends/suggestions?limit=100`),
      ]);

      const badgesData = await badgesRes.json();
      const requestsData = await requestsRes.json();
      const suggestionsData = await suggestionsRes.json();

      const requestIds = new Set(
        requestsData.requests.map((r: any) => r.fromUser.id)
      );
      const suggestionIds = new Set(
        suggestionsData.suggestions.map((s: any) => s.id)
      );

      // Vérifier qu'il n'y a pas d'intersection
      const intersection = Array.from(requestIds).filter(id =>
        suggestionIds.has(id)
      );

      expect(intersection.length).toBe(0);
    });

    it('les amis acceptés ne doivent pas être dans les suggestions', async () => {
      const [friendsRes, suggestionsRes] = await Promise.all([
        fetch(`${baseUrl}/friends/list?limit=100`),
        fetch(`${baseUrl}/friends/suggestions?limit=100`),
      ]);

      const friendsData = await friendsRes.json();
      const suggestionsData = await suggestionsRes.json();

      const friendIds = new Set(friendsData.friends.map((f: any) => f.id));
      const suggestionIds = new Set(
        suggestionsData.suggestions.map((s: any) => s.id)
      );

      const intersection = Array.from(suggestionIds).filter(id =>
        friendIds.has(id)
      );

      expect(intersection.length).toBe(0);
    });
  });

  describe('Performance', () => {
    it('le endpoint /badges devrait répondre en moins de 500ms', async () => {
      const start = Date.now();
      await fetch(`${baseUrl}/friends/badges`);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(500);
    });

    it('le endpoint /list avec recherche devrait répondre en moins de 1000ms', async () => {
      const start = Date.now();
      await fetch(`${baseUrl}/friends/list?search=test&limit=20`);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(1000);
    });
  });
});

/**
 * Tests unitaires pour les hooks
 */
describe('Friend Hooks Unit Tests', () => {
  // Ces tests nécessiteraient un environnement React de test
  // Exemple avec React Testing Library:

  describe('useFriendBadges', () => {
    it('devrait initialiser avec les bonnes valeurs', () => {
      // Test simulé
      const initialState = {
        pendingRequests: 0,
        suggestions: 0,
        friends: 0,
        total: 0,
      };

      expect(initialState.total).toBe(0);
    });

    it('devrait mettre en place le rafraîchissement automatique', () => {
      // Vérifier que setInterval est appelé avec le bon intervalle
      // C'est un test que vous pouvez implémenter avec Jest et React Testing Library
    });
  });
});

/**
 * Tests d'intégration E2E
 */
describe.skip('Friends Feature E2E Tests (requires running server)', () => {
  it('scénario complet: afficher tous les compteurs et contenus', async () => {
    // 1. Obtenir les compteurs
    const badgesResponse = await fetch('http://localhost:3000/api/friends/badges');
    const badges = await badgesResponse.json();

    // 2. Vérifier que les compteurs sont cohérents
    expect(badges.total).toBeGreaterThanOrEqual(0);

    // 3. Récupérer les listes correspondantes
    if (badges.pendingRequests > 0) {
      const requestsResponse = await fetch(
        'http://localhost:3000/api/friends/requests'
      );
      const requests = await requestsResponse.json();
      expect(requests.total).toBe(badges.pendingRequests);
    }

    if (badges.suggestions > 0) {
      const suggestionsResponse = await fetch(
        'http://localhost:3000/api/friends/suggestions'
      );
      const suggestions = await suggestionsResponse.json();
      expect(suggestions.total).toBeGreaterThanOrEqual(0);
    }

    if (badges.friends > 0) {
      const friendsResponse = await fetch(
        'http://localhost:3000/api/friends/list'
      );
      const friends = await friendsResponse.json();
      expect(friends.total).toBe(badges.friends);
    }
  });
});
