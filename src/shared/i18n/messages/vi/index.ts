import { mergeCatalogSections } from "../merge-catalog";
import core from "./core";
import projects from "./projects";
import settings from "./settings";
import script from "./script";
import director from "./director";
import characters from "./characters";
import scenes from "./scenes";
import generation from "./generation";
import media from "./media";
import features from "./features";
import account from "./account";
import tts from "./tts";
import research from "./research";
import mediaToolkit from "./media-toolkit";
import contentChat from "./content-chat";
import autoEdit from "./auto-edit";

const vi = mergeCatalogSections(
  core,
  projects,
  settings,
  script,
  director,
  characters,
  scenes,
  generation,
  media,
  features,
  account,
  tts,
  research,
  mediaToolkit,
  contentChat,
  autoEdit,
);

export default vi;
