# Japon 2027

Petite app web pour préparer et suivre un voyage de 20 nuits au Japon (4 → 24 juillet 2027, 6 voyageurs), avec un design inspiré des pages produit d'Apple et de vraies photos du Japon.

- **Accueil** : grande photo du mont Fuji, compte à rebours
- **Les étapes** : carrousel des 10 lieux du voyage
- **Itinéraire** : les 22 journées en cartes photo ; chacune s'ouvre avec son programme, ses liens Google Maps, un conseil, les dépenses du jour et des notes
- **La route** : la carte du trajet qui se dessine au fil du défilement
- **Préparer** : les réservations et démarches, mois par mois
- **Budget, valise, guide** : dépenses en € ou ¥, checklists, vols, logements, mont Fuji, phrases (prononciation audio), infos pratiques
- Recherche (`Ctrl+K`), thème clair/sombre, responsive

Aucune dépendance : HTML, CSS et JavaScript. Les données de suivi sont enregistrées dans le navigateur (`localStorage`), avec export/import JSON en bas de page.

## Lancer

```bash
npm start
```

Puis ouvrir http://localhost:5173. (`npm start` lance `server.py`, un petit serveur Python sans cache.)

## Fichiers

- `index.html`, `style.css`, `app.js` : l'app
- `data.js` : le contenu du voyage (jours, logements, tâches, budget, valise…)
- `photos.js`, `img/` : les photos (Wikimedia Commons, licences libres, crédits en bas de page)
- `old-v3/` : la version « La Ligne » (le voyage comme une ligne de train)
- `old-v2/` : la version tableau de bord à onglets
