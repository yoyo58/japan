# Japon 2027 · La Ligne

Petite app web pour préparer et suivre un voyage de 20 nuits au Japon (4 → 24 juillet 2027, 6 voyageurs).

Le voyage est présenté comme une ligne de train : chaque mois de préparation et chaque jour sur place est une gare (PR01, TK03, KS05…), avec un repère « Vous êtes ici ».

- **Ligne** : préparation, départ, Tokyo, Kansai, retour, avec activités, conseils, liens Google Maps, dépenses et notes par jour
- **Tableau des départs** : compte à rebours à volets et bandeau d'infos
- **Budget** : dépenses en € ou ¥, plafond, catégories, jour par jour
- **Valise** : checklists par catégorie
- **Guide** : carte du trajet, vols, logements, mont Fuji, phrases (prononciation audio), urgences, bons plans
- Recherche (`Ctrl+K`), raccourcis clavier, thème clair/sombre, responsive

Aucune dépendance : HTML, CSS et JavaScript. Les données de suivi sont enregistrées dans le navigateur (`localStorage`), avec export/import JSON dans Guide → Pratique.

## Lancer

```bash
npm start
```

Puis ouvrir http://localhost:5173. (`npm start` lance `server.py`, un petit serveur Python sans cache.)

## Fichiers

- `index.html`, `style.css`, `app.js` : l'app
- `data.js` : le contenu du voyage (jours, logements, tâches, budget, valise…)
- `old-v2/` : la version précédente (tableau de bord à onglets)
