# Purpose
Data cleaning - This folder contains files for the purpose of selecting information necessary to run the game.

# Complications and strategy
In no particular order, issues that need to be addressed and our preferred strategy:  
* Different languages use different characters, and some are very obscure
  * Restrict top level candidate characters to *only* those supported by GHJT+. 
* Unrepresentable components. These are generally unique to one character  
  * Replace insconsistent atomics with `*` or `{0}...{n}`. Any comparisons done later on should interpret `*` != `*` 
* "Duplicate" Hanzi characters. Worst case, these may vary slightly, or have different preferred representations in different languages
  * Interpret 2 characters are == if (not iff!) they have equal decompositions
  * This is somewhat conservative in (relatively few) cases where `*` is involved at the top level. I think this is an acceptable bug for SP0
* Inconsistent IDS + supported languages across the 2 hanzi databases
  * Come up with fusion strategy - track number of true conflicts and mark as problematic.
  * Fusion of atom with sequence = sequence
  * "True" conflicts include: disagreement on preferred sequence for a particular language
* Inconsistent preferred IDS across multiple languages
  * Most cases have equivalent characters in most positions, or preferred equivalent groupings. Normalization should be possible most of the time.
* Simplified only characters: 
  * Map simplified component to traditional component, merge.
* Invalid characters
  * Inline invalid composite character in all sequences using it. 
  * Replace invalid atoms with `{n}`
  * Delete; Repeat till all gone.
* Missing data:
  * Component-only characters, and the character they are derived from.
  * Simplified-traditional mappings
  * Annotations regarding width/height/mutation of characters after ⿺, etc.