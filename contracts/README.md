# MatkaNight Smart Contracts

This folder contains the zero-knowledge circuits and smart contracts for MatkaNight, implemented in Compact for the Midnight Network.

## Deployment Target
- **Network**: Midnight Mainnet / Kūkolu (PRD §9.3)
- **Proof System**: Groth16 over BLS12-381

## Circuit Architecture

1. **`types.compact`**: Defines the enums and structs used across the game (e.g., `Card`, `ZoneId`, `Bet`).
2. **`constants.compact`**: Stores universal rules, such as `MIN_BET`, `MAX_BET`, and specific payout rates for each zone.
3. **`MatkaNightGame.compact`**: The core game logic.
   - `placeBet`: Validates wagers and securely commits the hashed bet structure to the ledger. Called from the **Bet Confirmation Screen**.
   - `revealAndSettle`: Ensures the submitted bet parameters match the `betCommitment` hash and processes any payouts. Called from the **Card Revealed Screen**.
4. **`ShuffleOracle.compact`**: Cryptographic deck generation.
   - `commitShuffleSeed`: Registers the CSPRNG seed hash prior to drawing a card, assuring the draw is provably fair. Called from the **Shuffle Animation Screen**.
   - `verifyShuffle`: (Internal/Verification) Checks the revealed seed against the commitment.
5. **`Treasury.compact`**: Custody logic for the House bankroll, escrowing funds, and executing payouts.
6. **`StreakTracker.compact`**: Maintains a private streak counter, allowing users to prove win-streaks without revealing their total gameplay history.
