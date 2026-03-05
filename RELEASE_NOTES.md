# Release - v0.17.2 - Real-Time Orbital Kinematics

Sovereign Watch v0.17.2 introduces a major rendering engine upgrade for the Orbital Dashboard, bringing our space domain awareness to parity with the tactical aviation layer.

- **Projective Velocity Blending (PVB)**: Satellites no longer "snap" to a new location every 5 seconds. The UI now applies physics-based kinematics between SGP4 updates, granting observers buttery-smooth 60fps orbital motion.
- **Seamless Gap Bridges**: History tails (ground tracks) are now perfectly attached to their respective fast-moving satellites using a dynamic 3D segment layer.
- **Improved Interactions**: Fixed a Z-index conflict where the right panel's empty container intercepted map clicks, ensuring total map interactability when no entity is selected.

_(No special upgrade commands required, standard `docker compose up -d --build frontend` applies)._
