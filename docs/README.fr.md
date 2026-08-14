<div align="center">

<img src="../assets/banner.png" alt="Isenax - Outil de Diagrammes Isométriques" width="100%" />

</div>

<p align="center">
 <a href="../README.md">English</a> | <a href="README.cn.md">简体中文</a> | <a href="README.es.md">Español</a> | <a href="README.pt.md">Português</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.bn.md">বাংলা</a> | <a href="README.ru.md">Русский</a> | <a href="README.id.md">Bahasa Indonesia</a> | <a href="README.de.md">Deutsch</a> | <a href="README.ko.md">한국어</a> | <a href="README.ja.md">日本語</a> | <a href="README.it.md">Italiano</a> | <a href="README.pl.md">Polski</a> | <a href="README.tr.md">Türkçe</a>
</p>

## Remarque :

Ce dépôt (Isenax) est dérivé de [Abrar74774/FossFLOW](https://github.com/Abrar74774/FossFLOW), qui est lui-même un fork de stan-smith/FossFLOW (qui était à son tour un fork de [markmanx/isoflow](https://github.com/markmanx/isoflow)), créé à l'origine pour contribuer au dépôt original via des PR. Cependant, le nom d'utilisateur GitHub de l'auteur semble avoir changé pour [mug-book-droid](https://github.com/mug-book-droid) et son activité est passée en privé (compte peut-être suspendu ?), rendant le dépôt original inaccessible.

Pour l'instant, j'ai l'intention de faire de ce dépôt (désormais nommé Isenax) une continuation du développement de FossFLOW, et toute contribution via PR est également la bienvenue.

Vous pouvez consulter le dernier état du dépôt original que j'ai récupéré sur la branche `backup/stan-smith-FossFLOW`.

---

Isenax est une puissante Progressive Web App (PWA) open-source pour créer de beaux diagrammes isométriques. Construit avec React et la bibliothèque <a href="https://github.com/markmanx/isoflow">Isoflow</a> (forkée et publiée sur npm sous le nom fossflow, et sous le nom isenax dans ce fork), elle fonctionne entièrement dans votre navigateur avec support hors ligne.

---
<p align="center">
<b>Essayez-le en ligne --> https://nyangko.github.io/Isenax/ <-- </b>
</p>

<img width="100%" alt="Isenax-Isometric-Diagramming-Tool" src="https://github.com/user-attachments/assets/15956888-991a-4b5e-9849-dbd82d6f9308" />

---------

## 🐳 Déploiement Rapide avec Docker

```bash
# Utilisation de Docker Compose (recommandé - inclut le stockage persistant)
docker compose up

# Ou exécuter directement depuis Docker Hub avec stockage persistant
docker run -p 80:80 -v $(pwd)/diagrams:/data/diagrams nyangko/isenax:latest
```

Le stockage serveur est activé par défaut dans Docker. Vos diagrammes seront enregistrés (par défaut en tant que root) dans `./diagrams` sur l'hôte. Pour changer l'utilisateur ou l'ID de groupe utilisé pour l'enregistrement, définissez les variables d'environnement `PUID` et `PGID`.

Pour désactiver le stockage serveur, définissez `ENABLE_SERVER_STORAGE=false` :
```bash
docker run -p 80:80 -e ENABLE_SERVER_STORAGE=false nyangko/isenax:latest
```

### Authentification HTTP de Base (Optionnel)

Protégez votre instance Isenax avec HTTP Basic Auth :

```bash
# Avec Docker Compose
HTTP_AUTH_USER=admin HTTP_AUTH_PASSWORD=secret docker compose up

# Ou avec docker run
docker run -p 80:80 \
  -e HTTP_AUTH_USER=admin \
  -e HTTP_AUTH_PASSWORD=secret \
  nyangko/isenax:latest
```

> **Remarque** : Les deux variables doivent être définies pour activer l'authentification. Si l'une d'elles est vide, l'application est accessible sans connexion.

## Démarrage Rapide (Développement Local)

```bash
# Cloner le dépôt
git clone https://github.com/nyangko/Isenax
cd Isenax

# Installer les dépendances
npm install

# Compiler la bibliothèque (requis la première fois)
npm run build:lib

# Démarrer le serveur de développement
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur.

## Structure du Monorepo

Ceci est un monorepo contenant quatre packages :

- `packages/isenax-lib` - Bibliothèque de composants React pour dessiner des diagrammes de réseau (construite avec Rslib/Rspack)
- `packages/isenax-app` - Progressive Web App qui encapsule et présente la bibliothèque (construit avec RSBuild)
- `packages/isenax-backend` - Serveur Express fournissant un stockage auto-hébergé optionnel pour les diagrammes (utilisé dans le déploiement Docker)
- `packages/isenax-mcp` - Serveur MCP (Model Context Protocol) permettant à un agent IA externe de lire, créer et modifier vos diagrammes directement (stdio ou Streamable HTTP)

### Commandes de Développement

```bash
# Développement
npm run dev          # Démarrer le serveur de développement de l'application
npm run dev:lib      # Mode watch pour le développement de la bibliothèque

# Build
npm run build        # Compiler la bibliothèque et l'application
npm run build:lib    # Compiler uniquement la bibliothèque
npm run build:app    # Compiler uniquement l'application

# Tests et Linting
npm test             # Exécuter les tests unitaires
npm run lint         # Vérifier les erreurs de linting

# Tests E2E (Selenium)
cd e2e-tests
./run-tests.sh       # Exécuter les tests end-to-end (nécessite Docker et Python)

# Publication
npm run publish:lib  # Publier la bibliothèque sur npm
```

## Comment Utiliser

### Créer des Diagrammes

1. **Ajouter des Éléments** :
   - Appuyez sur le bouton "+" dans le menu en haut à droite, la bibliothèque de composants apparaîtra à gauche
   - Glissez et déposez les composants de la bibliothèque sur le canevas
   - Ou cliquez avec le bouton droit sur la grille et sélectionnez "Ajouter un nœud"

2. **Connecter des Éléments** :
   - Sélectionnez l'outil Connecteur (appuyez sur 'C' ou cliquez sur l'icône du connecteur)
   - **Mode clic** (par défaut) : Cliquez sur le premier nœud, puis cliquez sur le second nœud
   - **Mode glisser** (optionnel) : Cliquez et glissez du premier au second nœud
   - Basculez entre les modes dans Paramètres → onglet Connecteurs

3. **Sauvegarder Votre Travail** :
   - **Sauvegarde Rapide** - Enregistre dans la session du navigateur
   - **Exporter** - Télécharger comme fichier JSON
   - **Importer** - Charger depuis un fichier JSON

4. **Organiser avec le panneau Calques** :
   - Ouvrez Calques depuis la barre d'outils pour voir tous les nœuds, connecteurs, zones et blocs de texte dans une seule liste
   - Sélectionnez-y un élément pour le modifier dans l'onglet « Modifier » du même panneau
   - Sur écran étroit, il s'ouvre en feuille inférieure via le bouton en bas à droite du canevas

### Options de Stockage

- **Stockage de Session** : Sauvegardes temporaires effacées à la fermeture du navigateur
- **Exporter/Importer** : Stockage permanent sous forme de fichiers JSON
- **Sauvegarde Automatique** : Enregistre automatiquement les modifications toutes les 5 secondes dans la session

### Intégration MCP (Agents IA)

Isenax embarque un serveur MCP permettant à un agent IA externe (Claude, etc.) de lire, créer et modifier vos diagrammes directement :

1. Ouvrez **Paramètres → MCP** et activez-le — une URL de connexion et un token Bearer s'affichent.
2. Connectez votre client MCP à cette URL/ce token (`packages/isenax-mcp` prend en charge à la fois le transport stdio et Streamable HTTP).
3. Les modifications de l'agent apparaissent en direct dans tout onglet ouvert affichant ce diagramme, sans rechargement — un indicateur « MCP est en train d'écrire... » s'affiche pendant l'opération.

Les icônes intégrées ne voyagent que par id (aucune donnée base64 envoyée à l'agent), et `update_diagram_patch` permet à un agent de n'envoyer que les champs modifiés au lieu de renvoyer tout le modèle.

## Récemment ajouté

### Multiplexage des connecteurs
<img src="../demos/connectors.gif" alt="Multiplexed connectors demo" />

### Copier-coller des éléments
<img src="../demos/copy-paste-demo.gif" alt="Copy pasting demo" />

## Contribuer

Nous accueillons les contributions ! Veuillez consulter [CONTRIBUTING.md](../CONTRIBUTING.md) pour les directives.

## Documentation

- [ISENAX_ENCYCLOPEDIA.md](ISENAX_ENCYCLOPEDIA.md) - Guide complet de la base de code
- [CONTRIBUTING.md](../CONTRIBUTING.md) - Directives de contribution

## Licence

MIT
