-- MySQL dump 10.13  Distrib 9.2.0, for Linux (x86_64)
--
-- Host: localhost    Database: pokedex
-- ------------------------------------------------------
-- Server version	9.2.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Current Database: `pokedex`
--

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `pokedex` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;

USE `pokedex`;

--
-- Table structure for table `Ability`
--

DROP TABLE IF EXISTS `Ability`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Ability` (
  `ability_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `description` text,
  PRIMARY KEY (`ability_id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=966 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Ability`
--

LOCK TABLES `Ability` WRITE;
/*!40000 ALTER TABLE `Ability` DISABLE KEYS */;
INSERT INTO `Ability` VALUES (1,'Stench','Has a 10% chance of making target Pok├⌐mon flinch with each hit.'),(4,'Battle-armor','Protects against critical hits.'),(5,'Sturdy','Prevents being KOed from full HP, leaving 1 HP instead.  Protects against the one-hit KO moves regardless of HP.'),(6,'Damp','Prevents self destruct, explosion, and aftermath from working while the Pok├⌐mon is in battle.'),(7,'Limber','Prevents paralysis.'),(8,'Sand-veil','Increases evasion to 1.25├ù during a sandstorm.  Protects against sandstorm damage.'),(9,'Static','Has a 30% chance of paralyzing attacking Pok├⌐mon on contact.'),(10,'Volt-absorb','Absorbs electric moves, healing for 1/4 max HP.'),(11,'Water-absorb','Absorbs water moves, healing for 1/4 max HP.'),(12,'Oblivious','Prevents infatuation and protects against captivate.'),(13,'Cloud-nine','Negates all effects of weather, but does not prevent the weather itself.'),(14,'Compound-eyes','Increases moves\' accuracy to 1.3├ù.'),(15,'Insomnia','Prevents sleep.'),(17,'Immunity','Prevents poison.'),(18,'Flash-fire','Protects against fire moves.  Once one has been blocked, the Pok├⌐mon\'s own Fire moves inflict 1.5├ù damage until it leaves battle.'),(19,'Shield-dust','Protects against incoming moves\' extra effects.'),(20,'Own-tempo','Prevents confusion.'),(22,'Intimidate','Lowers opponents\' Attack one stage upon entering battle.'),(26,'Levitate','Evades ground moves.'),(27,'Effect-spore','Has a 30% chance of inflcting either paralysis, poison, or sleep on attacking Pok├⌐mon on contact.'),(28,'Synchronize','Copies burns, paralysis, and poison received onto the Pok├⌐mon that inflicted them.'),(29,'Clear-body','Prevents stats from being lowered by other Pok├⌐mon.'),(30,'Natural-cure','Cures any major status ailment upon switching out.'),(31,'Lightning-rod','Redirects single-target electric moves to this Pok├⌐mon where possible.  Absorbs Electric moves, raising Special Attack one stage.'),(32,'Serene-grace','Doubles the chance of moves\' extra effects occurring.'),(33,'Swift-swim','Doubles Speed during rain.'),(34,'Chlorophyll','Doubles Speed during strong sunlight.'),(35,'Illuminate','Doubles the wild encounter rate.'),(36,'Trace','Copies an opponent\'s ability upon entering battle.'),(38,'Poison-point','Has a 30% chance of poisoning attacking Pok├⌐mon on contact.'),(39,'Inner-focus','Prevents flinching.'),(41,'Water-veil','Prevents burns.'),(42,'Magnet-pull','Prevents steel opponents from fleeing or switching out.'),(43,'Soundproof','Protects against sound-based moves.'),(44,'Rain-dish','Heals for 1/16 max HP after each turn during rain.'),(46,'Pressure','Increases the PP cost of moves targetting the Pok├⌐mon by one.'),(47,'Thick-fat','Halves damage from fire and ice moves.'),(48,'Early-bird','Makes sleep pass twice as quickly.'),(49,'Flame-body','Has a 30% chance of burning attacking Pok├⌐mon on contact.'),(50,'Run-away','Ensures success fleeing from wild battles.'),(51,'Keen-eye','Prevents accuracy from being lowered.'),(52,'Hyper-cutter','Prevents Attack from being lowered by other Pok├⌐mon.'),(53,'Pickup','Picks up other Pok├⌐mon\'s used and Flung held items.  May also pick up an item after battle.'),(55,'Hustle','Strengthens physical moves to inflict 1.5├ù damage, but decreases their accuracy to 0.8├ù.'),(56,'Cute-charm','Has a 30% chance of infatuating attacking Pok├⌐mon on contact.'),(60,'Sticky-hold','Prevents a held item from being removed by other Pok├⌐mon.'),(61,'Shed-skin','Has a 33% chance of curing any major status ailment after each turn.'),(62,'Guts','Increases Attack to 1.5├ù with a major status ailment.'),(63,'Marvel-scale','Increases Defense to 1.5├ù with a major status ailment.'),(64,'Liquid-ooze','Damages opponents using leeching moves for as much as they would heal.'),(65,'Overgrow','Strengthens grass moves to inflict 1.5├ù damage at 1/3 max HP or less.'),(66,'Blaze','Strengthens fire moves to inflict 1.5├ù damage at 1/3 max HP or less.'),(67,'Torrent','Strengthens water moves to inflict 1.5├ù damage at 1/3 max HP or less.'),(68,'Swarm','Strengthens bug moves to inflict 1.5├ù damage at 1/3 max HP or less.'),(69,'Rock-head','Protects against recoil damage.'),(70,'Drought','Summons strong sunlight that lasts indefinitely upon entering battle.'),(71,'Arena-trap','Prevents opponents from fleeing or switching out.  Eluded by flying-types and Pok├⌐mon in the air.'),(72,'Vital-spirit','Prevents sleep.'),(75,'Shell-armor','Protects against critical hits.'),(77,'Tangled-feet','Doubles evasion when confused.'),(79,'Rivalry','Increases damage inflicted to 1.25├ù against Pok├⌐mon of the same gender, but decreases damage to 0.75├ù against the opposite gender.'),(80,'Steadfast','Raises Speed one stage upon flinching.'),(81,'Snow-cloak','Increases evasion to 1.25├ù during hail.  Protects against hail damage.'),(82,'Gluttony','Makes the Pok├⌐mon eat any held Berry triggered by low HP below 1/2 its max HP.'),(83,'Anger-point','Raises Attack to the maximum of six stages upon receiving a critical hit.'),(84,'Unburden','Doubles Speed upon using or losing a held item.'),(87,'Dry-skin','Causes 1/8 max HP in damage each turn during strong sunlight, but heals for 1/8 max HP during rain.  Increases damage from fire moves to 1.25├ù, but absorbs water moves, healing for 1/4 max HP.'),(88,'Download','Raises the attack stat corresponding to the opponents\' weaker defense one stage upon entering battle.'),(89,'Iron-fist','Strengthens punch-based moves to 1.2├ù their power.'),(91,'Adaptability','Increases the same-type attack bonus from 1.5├ù to 2├ù.'),(92,'Skill-link','Extends two-to-five-hit moves and triple kick to their full length every time.'),(93,'Hydration','Cures any major status ailment after each turn during rain.'),(94,'Solar-power','Increases Special Attack to 1.5├ù but costs 1/8 max HP after each turn during strong sunlight.'),(95,'Quick-feet','Increases Speed to 1.5├ù with a major status ailment.'),(97,'Sniper','Strengthens critical hits to inflict 3├ù damage rather than 2├ù.'),(98,'Magic-guard','Protects against damage not directly caused by a move.'),(99,'No-guard','Ensures all moves used by and against the Pok├⌐mon hit.'),(101,'Technician','Strengthens moves of 60 base power or less to 1.5├ù their power.'),(102,'Leaf-guard','Protects against major status ailments during strong sunlight.'),(104,'Mold-breaker','Bypasses targets\' abilities if they could hinder or prevent a move.'),(106,'Aftermath','Damages the attacker for 1/4 its max HP when knocked out by a contact move.'),(107,'Anticipation','Notifies all trainers upon entering battle if an opponent has a super-effective move, self destruct, explosion, or a one-hit KO move.'),(108,'Forewarn','Reveals the opponents\' strongest move upon entering battle.'),(109,'Unaware','Ignores other Pok├⌐mon\'s stat modifiers for damage and accuracy calculation.'),(110,'Tinted-lens','Doubles damage inflicted with not-very-effective moves.'),(111,'Filter','Decreases damage taken from super-effective moves by 1/4.'),(113,'Scrappy','Lets the Pok├⌐mon\'s normal and fighting moves hit ghost Pok├⌐mon.'),(115,'Ice-body','Heals for 1/16 max HP after each turn during hail.  Protects against hail damage.'),(119,'Frisk','Reveals an opponent\'s held item upon entering battle.'),(120,'Reckless','Strengthens recoil moves to 1.2├ù their power.'),(125,'Sheer-force','Strengthens moves with extra effects to 1.3├ù their power, but prevents their extra effects.'),(127,'Unnerve','Prevents opposing Pok├⌐mon from eating held Berries.'),(128,'Defiant','Raises Attack two stages upon having any stat lowered.'),(130,'Cursed-body','Has a 30% chance of Disabling any move that hits the Pok├⌐mon.'),(131,'Healer','Has a 30% chance of curing each adjacent ally of any major status ailment after each turn.'),(132,'Friend-guard','Decreases all direct damage taken by friendly Pok├⌐mon to 0.75├ù.'),(133,'Weak-armor','Raises Speed and lowers Defense by one stage each upon being hit by a physical move.'),(136,'Multiscale','Halves damage taken from full HP.'),(139,'Harvest','Has a 50% chance of restoring a used Berry after each turn if the Pok├⌐mon has held no items in the meantime.'),(142,'Overcoat','Protects against damage from weather.'),(143,'Poison-touch','Has a 30% chance of poisoning target Pok├⌐mon upon contact.'),(144,'Regenerator','Heals for 1/3 max HP upon switching out.'),(145,'Big-pecks','Protects against Defense drops.'),(146,'Sand-rush','Doubles Speed during a sandstorm.  Protects against sandstorm damage.'),(147,'Wonder-skin','Lowers incoming non-damaging moves\' base accuracy to exactly 50%.'),(148,'Analytic','Strengthens moves to 1.3├ù their power when moving last.'),(150,'Imposter','Transforms upon entering battle.'),(151,'Infiltrator','Bypasses light screen, reflect, and safeguard.'),(153,'Moxie','Raises Attack one stage upon KOing a Pok├⌐mon.'),(154,'Justified','Raises Attack one stage upon taking damage from a dark move.'),(155,'Rattled','Raises Speed one stage upon being hit by a dark, ghost, or bug move.'),(159,'Sand-force','Strengthens rock, ground, and steel moves to 1.3├ù their power during a sandstorm.  Protects against sandstorm damage.'),(172,'Competitive','Raises Special Attack by two stages upon having any stat lowered.');
/*!40000 ALTER TABLE `Ability` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Evolution`
--

DROP TABLE IF EXISTS `Evolution`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Evolution` (
  `evolution_id` int NOT NULL AUTO_INCREMENT,
  `base_pokemon_id` int DEFAULT NULL,
  `evolved_pokemon_id` int DEFAULT NULL,
  `evolution_method` varchar(50) DEFAULT NULL,
  `evolution_condition` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`evolution_id`),
  KEY `base_pokemon_id` (`base_pokemon_id`),
  KEY `evolved_pokemon_id` (`evolved_pokemon_id`),
  CONSTRAINT `Evolution_ibfk_1` FOREIGN KEY (`base_pokemon_id`) REFERENCES `Pokemon` (`pokemon_id`),
  CONSTRAINT `Evolution_ibfk_2` FOREIGN KEY (`evolved_pokemon_id`) REFERENCES `Pokemon` (`pokemon_id`)
) ENGINE=InnoDB AUTO_INCREMENT=561 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Evolution`
--

LOCK TABLES `Evolution` WRITE;
/*!40000 ALTER TABLE `Evolution` DISABLE KEYS */;
INSERT INTO `Evolution` VALUES (1,1,2,'level-up','Level 16'),(2,2,3,'level-up','Level 32'),(3,4,5,'level-up','Level 16'),(4,5,6,'level-up','Level 36'),(5,7,8,'level-up','Level 16'),(6,8,9,'level-up','Level 36'),(7,10,11,'level-up','Level 7'),(8,11,12,'level-up','Level 10'),(9,13,14,'level-up','Level 7'),(10,14,15,'level-up','Level 10'),(11,16,17,'level-up','Level 18'),(12,17,18,'level-up','Level 36'),(13,19,20,'level-up','Level 20'),(14,21,22,'level-up','Level 20'),(15,23,24,'level-up','Level 22'),(16,27,28,'level-up','Level 22'),(17,29,30,'level-up','Level 16'),(18,30,31,'use-item','Use moon-stone'),(19,32,33,'level-up','Level 16'),(20,33,34,'use-item','Use moon-stone'),(21,37,38,'use-item','Use fire-stone'),(22,41,42,'level-up','Level 22'),(23,43,44,'level-up','Level 21'),(24,44,45,'use-item','Use leaf-stone'),(25,46,47,'level-up','Level 24'),(26,48,49,'level-up','Level 31'),(27,50,51,'level-up','Level 26'),(28,52,53,'level-up','Level 28'),(29,54,55,'level-up','Level 33'),(30,56,57,'level-up','Level 28'),(31,58,59,'use-item','Use fire-stone'),(32,60,61,'level-up','Level 25'),(33,61,62,'use-item','Use water-stone'),(34,63,64,'level-up','Level 16'),(35,64,65,'trade',''),(36,66,67,'level-up','Level 28'),(37,67,68,'trade',''),(38,69,70,'level-up','Level 21'),(39,70,71,'use-item','Use leaf-stone'),(40,72,73,'level-up','Level 30'),(41,74,75,'level-up','Level 25'),(42,75,76,'trade',''),(43,77,78,'level-up','Level 40'),(44,79,80,'level-up','Level 37'),(45,81,82,'level-up','Level 30'),(46,84,85,'level-up','Level 31'),(47,86,87,'level-up','Level 34'),(48,88,89,'level-up','Level 38'),(49,90,91,'use-item','Use water-stone'),(50,92,93,'level-up','Level 25'),(51,93,94,'trade',''),(52,96,97,'level-up','Level 26'),(53,98,99,'level-up','Level 28'),(54,100,101,'level-up','Level 30'),(55,102,103,'use-item','Use leaf-stone'),(56,104,105,'level-up','Level 28'),(57,109,110,'level-up','Level 35'),(58,111,112,'level-up','Level 42'),(59,116,117,'level-up','Level 32'),(60,118,119,'level-up','Level 33'),(61,120,121,'use-item','Use water-stone'),(62,129,130,'level-up','Level 20'),(63,133,134,'use-item','Use water-stone'),(64,133,135,'use-item','Use thunder-stone'),(65,133,136,'use-item','Use fire-stone'),(66,138,139,'level-up','Level 40'),(67,140,141,'level-up','Level 40'),(68,147,148,'level-up','Level 30'),(69,148,149,'level-up','Level 55'),(70,25,26,'use-item','Use thunder-stone'),(71,35,36,'use-item','Use moon-stone'),(72,39,40,'use-item','Use moon-stone');
/*!40000 ALTER TABLE `Evolution` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Move`
--

DROP TABLE IF EXISTS `Move`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Move` (
  `move_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `type_id` int DEFAULT NULL,
  `power` int DEFAULT NULL,
  `accuracy` int DEFAULT NULL,
  `pp` int DEFAULT NULL,
  PRIMARY KEY (`move_id`),
  UNIQUE KEY `name` (`name`),
  KEY `type_id` (`type_id`),
  CONSTRAINT `Move_ibfk_1` FOREIGN KEY (`type_id`) REFERENCES `Type` (`type_id`)
) ENGINE=InnoDB AUTO_INCREMENT=868 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Move`
--

LOCK TABLES `Move` WRITE;
/*!40000 ALTER TABLE `Move` DISABLE KEYS */;
INSERT INTO `Move` VALUES (1,'Pound',1,40,100,35),(2,'Karate-chop',7,50,100,25),(3,'Double-slap',1,15,85,10),(4,'Comet-punch',1,18,85,15),(5,'Mega-punch',1,80,85,20),(6,'Pay-day',1,40,100,20),(7,'Fire-punch',2,75,100,15),(8,'Ice-punch',6,75,100,15),(9,'Thunder-punch',5,75,100,15),(10,'Scratch',1,40,100,35),(11,'Vice-grip',1,55,100,30),(12,'Guillotine',1,NULL,30,5),(14,'Swords-dance',1,NULL,NULL,20),(16,'Gust',10,40,100,35),(17,'Wing-attack',10,60,100,35),(18,'Whirlwind',1,NULL,NULL,20),(20,'Bind',1,15,85,20),(21,'Slam',1,80,75,20),(22,'Vine-whip',4,45,100,25),(23,'Stomp',1,65,100,20),(24,'Double-kick',7,30,100,30),(25,'Mega-kick',1,120,75,5),(26,'Jump-kick',7,100,95,10),(27,'Rolling-kick',7,60,85,15),(28,'Sand-attack',9,NULL,100,15),(29,'Headbutt',1,70,100,15),(30,'Horn-attack',1,65,100,25),(31,'Fury-attack',1,15,85,20),(32,'Horn-drill',1,NULL,30,5),(33,'Tackle',1,40,100,35),(34,'Body-slam',1,85,100,15),(35,'Wrap',1,15,90,20),(36,'Take-down',1,90,85,20),(37,'Thrash',1,120,100,10),(38,'Double-edge',1,120,100,15),(39,'Tail-whip',1,NULL,100,30),(40,'Poison-sting',8,15,100,35),(41,'Twineedle',12,25,100,20),(42,'Pin-missile',12,25,95,20),(43,'Leer',1,NULL,100,30),(44,'Bite',16,60,100,25),(45,'Growl',1,NULL,100,40),(46,'Roar',1,NULL,NULL,20),(47,'Sing',1,NULL,55,15),(48,'Supersonic',1,NULL,55,20),(49,'Sonic-boom',1,NULL,90,20),(50,'Disable',1,NULL,100,20),(51,'Acid',8,40,100,30),(52,'Ember',2,40,100,25),(53,'Flamethrower',2,90,100,15),(54,'Mist',6,NULL,NULL,30),(55,'Water-gun',3,40,100,25),(56,'Hydro-pump',3,110,80,5),(58,'Ice-beam',6,90,100,10),(59,'Blizzard',6,110,70,5),(60,'Psybeam',11,65,100,20),(61,'Bubble-beam',3,65,100,20),(62,'Aurora-beam',6,65,100,20),(63,'Hyper-beam',1,150,90,5),(64,'Peck',10,35,100,35),(65,'Drill-peck',10,80,100,20),(66,'Submission',7,80,80,20),(67,'Low-kick',7,NULL,100,20),(68,'Counter',7,NULL,100,20),(69,'Seismic-toss',7,NULL,100,20),(71,'Absorb',4,20,100,25),(72,'Mega-drain',4,40,100,15),(73,'Leech-seed',4,NULL,90,10),(74,'Growth',1,NULL,NULL,20),(75,'Razor-leaf',4,55,95,25),(76,'Solar-beam',4,120,100,10),(77,'Poison-powder',8,NULL,75,35),(78,'Stun-spore',4,NULL,75,30),(79,'Sleep-powder',4,NULL,75,15),(80,'Petal-dance',4,120,100,10),(81,'String-shot',12,NULL,95,40),(82,'Dragon-rage',15,NULL,100,10),(83,'Fire-spin',2,35,85,15),(84,'Thunder-shock',5,40,100,30),(85,'Thunderbolt',5,90,100,15),(86,'Thunder-wave',5,NULL,90,20),(87,'Thunder',5,110,70,10),(88,'Rock-throw',13,50,90,15),(89,'Earthquake',9,100,100,10),(90,'Fissure',9,NULL,30,5),(91,'Dig',9,80,100,10),(93,'Confusion',11,50,100,25),(94,'Psychic',11,90,100,10),(95,'Hypnosis',11,NULL,60,20),(96,'Meditate',11,NULL,NULL,40),(97,'Agility',11,NULL,NULL,30),(98,'Quick-attack',1,40,100,30),(99,'Rage',1,20,100,20),(100,'Teleport',11,NULL,NULL,20),(101,'Night-shade',14,NULL,100,15),(102,'Mimic',1,NULL,NULL,10),(103,'Screech',1,NULL,85,40),(104,'Double-team',1,NULL,NULL,15),(105,'Recover',1,NULL,NULL,5),(106,'Harden',1,NULL,NULL,30),(107,'Minimize',1,NULL,NULL,10),(108,'Smokescreen',1,NULL,100,20),(109,'Confuse-ray',14,NULL,100,10),(110,'Withdraw',3,NULL,NULL,40),(111,'Defense-curl',1,NULL,NULL,40),(112,'Barrier',11,NULL,NULL,20),(113,'Light-screen',11,NULL,NULL,30),(114,'Haze',6,NULL,NULL,30),(115,'Reflect',11,NULL,NULL,20),(116,'Focus-energy',1,NULL,NULL,30),(118,'Metronome',1,NULL,NULL,10),(119,'Mirror-move',10,NULL,NULL,20),(120,'Self-destruct',1,200,100,5),(121,'Egg-bomb',1,100,75,10),(122,'Lick',14,30,100,30),(123,'Smog',8,30,70,20),(124,'Sludge',8,65,100,20),(125,'Bone-club',9,65,85,20),(126,'Fire-blast',2,110,85,5),(127,'Waterfall',3,80,100,15),(128,'Clamp',3,35,85,15),(129,'Swift',1,60,NULL,20),(130,'Skull-bash',1,130,100,10),(131,'Spike-cannon',1,20,100,15),(132,'Constrict',1,10,100,35),(133,'Amnesia',11,NULL,NULL,20),(134,'Kinesis',11,NULL,80,15),(135,'Soft-boiled',1,NULL,NULL,5),(136,'High-jump-kick',7,130,90,10),(137,'Glare',1,NULL,100,30),(138,'Dream-eater',11,100,100,15),(139,'Poison-gas',8,NULL,90,40),(140,'Barrage',1,15,85,20),(141,'Leech-life',12,80,100,10),(142,'Lovely-kiss',1,NULL,75,10),(143,'Sky-attack',10,140,90,5),(144,'Transform',1,NULL,NULL,10),(145,'Bubble',3,40,100,30),(146,'Dizzy-punch',1,70,100,10),(147,'Spore',4,NULL,100,15),(150,'Splash',1,NULL,NULL,40),(151,'Acid-armor',8,NULL,NULL,20),(152,'Crabhammer',3,100,90,10),(153,'Explosion',1,250,100,5),(154,'Fury-swipes',1,18,80,15),(155,'Bonemerang',9,50,90,10),(156,'Rest',11,NULL,NULL,5),(158,'Hyper-fang',1,80,90,15),(159,'Sharpen',1,NULL,NULL,30),(160,'Conversion',1,NULL,NULL,30),(161,'Tri-attack',1,80,100,10),(162,'Super-fang',1,NULL,90,10),(163,'Slash',1,70,100,20),(164,'Substitute',1,NULL,NULL,10),(170,'Mind-reader',1,NULL,NULL,5),(171,'Nightmare',14,NULL,100,15),(172,'Flame-wheel',2,60,100,25),(173,'Snore',1,50,100,15),(174,'Curse',14,NULL,NULL,10),(175,'Flail',1,NULL,100,15),(176,'Conversion-2',1,NULL,NULL,30),(179,'Reversal',7,NULL,100,15),(180,'Spite',14,NULL,100,10),(181,'Powder-snow',6,40,100,25),(182,'Protect',1,NULL,NULL,10),(183,'Mach-punch',7,40,100,30),(184,'Scary-face',1,NULL,100,10),(185,'Feint-attack',16,60,NULL,20),(187,'Belly-drum',1,NULL,NULL,10),(188,'Sludge-bomb',8,90,100,10),(189,'Mud-slap',9,20,100,10),(191,'Spikes',9,NULL,NULL,20),(192,'Zap-cannon',5,120,50,5),(193,'Foresight',1,NULL,NULL,40),(194,'Destiny-bond',14,NULL,NULL,5),(195,'Perish-song',1,NULL,NULL,5),(196,'Icy-wind',6,55,95,15),(197,'Detect',7,NULL,NULL,5),(198,'Bone-rush',9,25,90,10),(199,'Lock-on',1,NULL,NULL,5),(200,'Outrage',15,120,100,10),(201,'Sandstorm',13,NULL,NULL,10),(202,'Giga-drain',4,75,100,10),(203,'Endure',1,NULL,NULL,10),(205,'Rollout',13,30,90,20),(206,'False-swipe',1,40,100,40),(207,'Swagger',1,NULL,85,15),(209,'Spark',5,65,100,20),(210,'Fury-cutter',12,40,95,20),(212,'Mean-look',1,NULL,NULL,5),(214,'Sleep-talk',1,NULL,NULL,10),(219,'Safeguard',1,NULL,NULL,25),(222,'Magnitude',9,NULL,100,30),(223,'Dynamic-punch',7,100,50,5),(224,'Megahorn',12,120,85,10),(225,'Dragon-breath',15,60,100,20),(226,'Baton-pass',1,NULL,NULL,40),(227,'Encore',1,NULL,100,5),(228,'Pursuit',16,40,100,20),(229,'Rapid-spin',1,50,100,40),(230,'Sweet-scent',1,NULL,100,20),(231,'Iron-tail',17,100,75,15),(232,'Metal-claw',17,50,95,35),(233,'Vital-throw',7,70,NULL,10),(235,'Synthesis',4,NULL,NULL,5),(236,'Moonlight',18,NULL,NULL,5),(238,'Cross-chop',7,100,80,5),(239,'Twister',15,40,100,20),(240,'Rain-dance',3,NULL,NULL,5),(241,'Sunny-day',2,NULL,NULL,5),(242,'Crunch',16,80,100,15),(243,'Mirror-coat',11,NULL,100,20),(244,'Psych-up',1,NULL,NULL,10),(245,'Extreme-speed',1,80,100,5),(246,'Ancient-power',13,60,100,5),(247,'Shadow-ball',14,80,100,15),(248,'Future-sight',11,120,100,10),(252,'Fake-out',1,40,100,10),(253,'Uproar',1,90,100,10),(254,'Stockpile',1,NULL,NULL,20),(255,'Spit-up',1,NULL,100,10),(256,'Swallow',1,NULL,NULL,10),(257,'Heat-wave',2,95,90,10),(260,'Flatter',16,NULL,100,15),(261,'Will-o-wisp',2,NULL,85,15),(262,'Memento',16,NULL,100,10),(266,'Follow-me',1,NULL,NULL,20),(268,'Charge',5,NULL,NULL,20),(270,'Helping-hand',1,NULL,NULL,20),(271,'Trick',11,NULL,100,10),(272,'Role-play',11,NULL,NULL,10),(275,'Ingrain',4,NULL,NULL,20),(276,'Superpower',7,120,100,5),(278,'Recycle',1,NULL,NULL,10),(279,'Revenge',7,60,100,10),(280,'Brick-break',7,75,100,15),(281,'Yawn',1,NULL,NULL,10),(282,'Knock-off',16,65,100,20),(283,'Endeavor',1,NULL,100,5),(286,'Imprison',11,NULL,NULL,10),(287,'Refresh',1,NULL,NULL,20),(288,'Grudge',14,NULL,NULL,5),(293,'Camouflage',1,NULL,NULL,20),(297,'Feather-dance',10,NULL,100,15),(300,'Mud-sport',9,NULL,NULL,15),(304,'Hyper-voice',1,90,100,10),(305,'Poison-fang',8,50,100,15),(309,'Meteor-mash',17,90,90,10),(310,'Astonish',14,30,100,15),(312,'Aromatherapy',4,NULL,NULL,5),(313,'Fake-tears',16,NULL,100,20),(314,'Air-cutter',10,60,95,25),(316,'Odor-sleuth',1,NULL,NULL,40),(318,'Silver-wind',12,60,100,5),(319,'Metal-sound',17,NULL,85,40),(321,'Tickle',1,NULL,100,20),(322,'Cosmic-power',11,NULL,NULL,20),(324,'Signal-beam',12,75,100,15),(325,'Shadow-punch',14,60,NULL,20),(327,'Sky-uppercut',7,85,90,15),(328,'Sand-tomb',9,35,85,15),(329,'Sheer-cold',6,NULL,30,5),(332,'Aerial-ace',10,60,NULL,20),(333,'Icicle-spear',6,25,100,30),(335,'Block',1,NULL,NULL,5),(340,'Bounce',10,85,85,5),(341,'Mud-shot',9,55,95,15),(343,'Covet',1,60,100,25),(345,'Magical-leaf',4,60,NULL,20),(346,'Water-sport',3,NULL,NULL,15),(347,'Calm-mind',11,NULL,NULL,20),(349,'Dragon-dance',15,NULL,NULL,20),(350,'Rock-blast',13,25,90,10);
/*!40000 ALTER TABLE `Move` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Pokemon`
--

DROP TABLE IF EXISTS `Pokemon`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Pokemon` (
  `pokemon_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `height` decimal(4,2) DEFAULT NULL,
  `weight` decimal(6,2) DEFAULT NULL,
  `base_experience` int DEFAULT NULL,
  `hp` int DEFAULT NULL,
  `attack` int DEFAULT NULL,
  `defense` int DEFAULT NULL,
  `special_attack` int DEFAULT NULL,
  `special_defense` int DEFAULT NULL,
  `speed` int DEFAULT NULL,
  `img_src` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`pokemon_id`)
) ENGINE=InnoDB AUTO_INCREMENT=303 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Pokemon`
--

LOCK TABLES `Pokemon` WRITE;
/*!40000 ALTER TABLE `Pokemon` DISABLE KEYS */;
INSERT INTO `Pokemon` VALUES (1,'bulbasaur',0.70,6.90,64,45,49,49,65,65,45,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/1.png'),(2,'ivysaur',1.00,13.00,142,60,62,63,80,80,60,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/2.png'),(3,'venusaur',2.00,100.00,263,80,82,83,100,100,80,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/3.png'),(4,'charmander',0.60,8.50,62,39,52,43,60,50,65,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/4.png'),(5,'charmeleon',1.10,19.00,142,58,64,58,80,65,80,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/5.png'),(6,'charizard',1.70,90.50,267,78,84,78,109,85,100,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/6.png'),(7,'squirtle',0.50,9.00,63,44,48,65,50,64,43,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/7.png'),(8,'wartortle',1.00,22.50,142,59,63,80,65,80,58,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/8.png'),(9,'blastoise',1.60,85.50,265,79,83,100,85,105,78,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/9.png'),(10,'caterpie',0.30,2.90,39,45,30,35,20,20,45,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10.png'),(11,'metapod',0.70,9.90,72,50,20,55,25,25,30,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/11.png'),(12,'butterfree',1.10,32.00,198,60,45,50,90,80,70,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/12.png'),(13,'weedle',0.30,3.20,39,40,35,30,20,20,50,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/13.png'),(14,'kakuna',0.60,10.00,72,45,25,50,25,25,35,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/14.png'),(15,'beedrill',1.00,29.50,178,65,90,40,45,80,75,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/15.png'),(16,'pidgey',0.30,1.80,50,40,45,40,35,35,56,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/16.png'),(17,'pidgeotto',1.10,30.00,122,63,60,55,50,50,71,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/17.png'),(18,'pidgeot',1.50,39.50,216,83,80,75,70,70,101,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/18.png'),(19,'rattata',0.30,3.50,51,30,56,35,25,35,72,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/19.png'),(20,'raticate',0.70,18.50,145,55,81,60,50,70,97,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/20.png'),(21,'spearow',0.30,2.00,52,40,60,30,31,31,70,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/21.png'),(22,'fearow',1.20,38.00,155,65,90,65,61,61,100,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/22.png'),(23,'ekans',2.00,6.90,58,35,60,44,40,54,55,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/23.png'),(24,'arbok',3.50,65.00,157,60,95,69,65,79,80,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/24.png'),(25,'pikachu',0.40,6.00,112,35,55,40,50,50,90,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png'),(26,'raichu',0.80,30.00,243,60,90,55,90,80,110,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/26.png'),(27,'sandshrew',0.60,12.00,60,50,75,85,20,30,40,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/27.png'),(28,'sandslash',1.00,29.50,158,75,100,110,45,55,65,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/28.png'),(29,'nidoran-f',0.40,7.00,55,55,47,52,40,40,41,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/29.png'),(30,'nidorina',0.80,20.00,128,70,62,67,55,55,56,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/30.png'),(31,'nidoqueen',1.30,60.00,253,90,92,87,75,85,76,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/31.png'),(32,'nidoran-m',0.50,9.00,55,46,57,40,40,40,50,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/32.png'),(33,'nidorino',0.90,19.50,128,61,72,57,55,55,65,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/33.png'),(34,'nidoking',1.40,62.00,253,81,102,77,85,75,85,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/34.png'),(35,'clefairy',0.60,7.50,113,70,45,48,60,65,35,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/35.png'),(36,'clefable',1.30,40.00,242,95,70,73,95,90,60,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/36.png'),(37,'vulpix',0.60,9.90,60,38,41,40,50,65,65,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/37.png'),(38,'ninetales',1.10,19.90,177,73,76,75,81,100,100,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/38.png'),(39,'jigglypuff',0.50,5.50,95,115,45,20,45,25,20,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/39.png'),(40,'wigglytuff',1.00,12.00,218,140,70,45,85,50,45,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/40.png'),(41,'zubat',0.80,7.50,49,40,45,35,30,40,55,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/41.png'),(42,'golbat',1.60,55.00,159,75,80,70,65,75,90,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/42.png'),(43,'oddish',0.50,5.40,64,45,50,55,75,65,30,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/43.png'),(44,'gloom',0.80,8.60,138,60,65,70,85,75,40,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/44.png'),(45,'vileplume',1.20,18.60,245,75,80,85,110,90,50,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/45.png'),(46,'paras',0.30,5.40,57,35,70,55,45,55,25,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/46.png'),(47,'parasect',1.00,29.50,142,60,95,80,60,80,30,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/47.png'),(48,'venonat',1.00,30.00,61,60,55,50,40,55,45,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/48.png'),(49,'venomoth',1.50,12.50,158,70,65,60,90,75,90,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/49.png'),(50,'diglett',0.20,0.80,53,10,55,25,35,45,95,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/50.png'),(51,'dugtrio',0.70,33.30,149,35,100,50,50,70,120,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/51.png'),(52,'meowth',0.40,4.20,58,40,45,35,40,40,90,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/52.png'),(53,'persian',1.00,32.00,154,65,70,60,65,65,115,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/53.png'),(54,'psyduck',0.80,19.60,64,50,52,48,65,50,55,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/54.png'),(55,'golduck',1.70,76.60,175,80,82,78,95,80,85,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/55.png'),(56,'mankey',0.50,28.00,61,40,80,35,35,45,70,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/56.png'),(57,'primeape',1.00,32.00,159,65,105,60,60,70,95,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/57.png'),(58,'growlithe',0.70,19.00,70,55,70,45,70,50,60,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/58.png'),(59,'arcanine',1.90,155.00,194,90,110,80,100,80,95,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/59.png'),(60,'poliwag',0.60,12.40,60,40,50,40,40,40,90,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/60.png'),(61,'poliwhirl',1.00,20.00,135,65,65,65,50,50,90,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/61.png'),(62,'poliwrath',1.30,54.00,255,90,95,95,70,90,70,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/62.png'),(63,'abra',0.90,19.50,62,25,20,15,105,55,90,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/63.png'),(64,'kadabra',1.30,56.50,140,40,35,30,120,70,105,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/64.png'),(65,'alakazam',1.50,48.00,250,55,50,45,135,95,120,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/65.png'),(66,'machop',0.80,19.50,61,70,80,50,35,35,35,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/66.png'),(67,'machoke',1.50,70.50,142,80,100,70,50,60,45,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/67.png'),(68,'machamp',1.60,130.00,253,90,130,80,65,85,55,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/68.png'),(69,'bellsprout',0.70,4.00,60,50,75,35,70,30,40,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/69.png'),(70,'weepinbell',1.00,6.40,137,65,90,50,85,45,55,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/70.png'),(71,'victreebel',1.70,15.50,221,80,105,65,100,70,70,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/71.png'),(72,'tentacool',0.90,45.50,67,40,40,35,50,100,70,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/72.png'),(73,'tentacruel',1.60,55.00,180,80,70,65,80,120,100,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/73.png'),(74,'geodude',0.40,20.00,60,40,80,100,30,30,20,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/74.png'),(75,'graveler',1.00,105.00,137,55,95,115,45,45,35,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/75.png'),(76,'golem',1.40,300.00,223,80,120,130,55,65,45,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/76.png'),(77,'ponyta',1.00,30.00,82,50,85,55,65,65,90,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/77.png'),(78,'rapidash',1.70,95.00,175,65,100,70,80,80,105,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/78.png'),(79,'slowpoke',1.20,36.00,63,90,65,65,40,40,15,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/79.png'),(80,'slowbro',1.60,78.50,172,95,75,110,100,80,30,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/80.png'),(81,'magnemite',0.30,6.00,65,25,35,70,95,55,45,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/81.png'),(82,'magneton',1.00,60.00,163,50,60,95,120,70,70,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/82.png'),(83,'farfetchd',0.80,15.00,132,52,90,55,58,62,60,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/83.png'),(84,'doduo',1.40,39.20,62,35,85,45,35,35,75,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/84.png'),(85,'dodrio',1.80,85.20,165,60,110,70,60,60,110,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/85.png'),(86,'seel',1.10,90.00,65,65,45,55,45,70,45,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/86.png'),(87,'dewgong',1.70,120.00,166,90,70,80,70,95,70,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/87.png'),(88,'grimer',0.90,30.00,65,80,80,50,40,50,25,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/88.png'),(89,'muk',1.20,30.00,175,105,105,75,65,100,50,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/89.png'),(90,'shellder',0.30,4.00,61,30,65,100,45,25,40,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/90.png'),(91,'cloyster',1.50,132.50,184,50,95,180,85,45,70,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/91.png'),(92,'gastly',1.30,0.10,62,30,35,30,100,35,80,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/92.png'),(93,'haunter',1.60,0.10,142,45,50,45,115,55,95,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/93.png'),(94,'gengar',1.50,40.50,250,60,65,60,130,75,110,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/94.png'),(95,'onix',8.80,210.00,77,35,45,160,30,45,70,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/95.png'),(96,'drowzee',1.00,32.40,66,60,48,45,43,90,42,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/96.png'),(97,'hypno',1.60,75.60,169,85,73,70,73,115,67,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/97.png'),(98,'krabby',0.40,6.50,65,30,105,90,25,25,50,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/98.png'),(99,'kingler',1.30,60.00,166,55,130,115,50,50,75,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/99.png'),(100,'voltorb',0.50,10.40,66,40,30,50,55,55,100,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/100.png'),(101,'electrode',1.20,66.60,172,60,50,70,80,80,150,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/101.png'),(102,'exeggcute',0.40,2.50,65,60,40,80,60,45,40,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/102.png'),(103,'exeggutor',2.00,120.00,186,95,95,85,125,75,55,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/103.png'),(104,'cubone',0.40,6.50,64,50,50,95,40,50,35,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/104.png'),(105,'marowak',1.00,45.00,149,60,80,110,50,80,45,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/105.png'),(106,'hitmonlee',1.50,49.80,159,50,120,53,35,110,87,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/106.png'),(107,'hitmonchan',1.40,50.20,159,50,105,79,35,110,76,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/107.png'),(108,'lickitung',1.20,65.50,77,90,55,75,60,75,30,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/108.png'),(109,'koffing',0.60,1.00,68,40,65,95,60,45,35,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/109.png'),(110,'weezing',1.20,9.50,172,65,90,120,85,70,60,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/110.png'),(111,'rhyhorn',1.00,115.00,69,80,85,95,30,30,25,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/111.png'),(112,'rhydon',1.90,120.00,170,105,130,120,45,45,40,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/112.png'),(113,'chansey',1.10,34.60,395,250,5,5,35,105,50,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/113.png'),(114,'tangela',1.00,35.00,87,65,55,115,100,40,60,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/114.png'),(115,'kangaskhan',2.20,80.00,172,105,95,80,40,80,90,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/115.png'),(116,'horsea',0.40,8.00,59,30,40,70,70,25,60,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/116.png'),(117,'seadra',1.20,25.00,154,55,65,95,95,45,85,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/117.png'),(118,'goldeen',0.60,15.00,64,45,67,60,35,50,63,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/118.png'),(119,'seaking',1.30,39.00,158,80,92,65,65,80,68,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/119.png'),(120,'staryu',0.80,34.50,68,30,45,55,70,55,85,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/120.png'),(121,'starmie',1.10,80.00,182,60,75,85,100,85,115,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/121.png'),(122,'mr-mime',1.30,54.50,161,40,45,65,100,120,90,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/122.png'),(123,'scyther',1.50,56.00,100,70,110,80,55,80,105,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/123.png'),(124,'jynx',1.40,40.60,159,65,50,35,115,95,95,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/124.png'),(125,'electabuzz',1.10,30.00,172,65,83,57,95,85,105,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/125.png'),(126,'magmar',1.30,44.50,173,65,95,57,100,85,93,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/126.png'),(127,'pinsir',1.50,55.00,175,65,125,100,55,70,85,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/127.png'),(128,'tauros',1.40,88.40,172,75,100,95,40,70,110,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/128.png'),(129,'magikarp',0.90,10.00,40,20,10,55,15,20,80,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/129.png'),(130,'gyarados',6.50,235.00,189,95,125,79,60,100,81,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/130.png'),(131,'lapras',2.50,220.00,187,130,85,80,85,95,60,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/131.png'),(132,'ditto',0.30,4.00,101,48,48,48,48,48,48,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/132.png'),(133,'eevee',0.30,6.50,65,55,55,50,45,65,55,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/133.png'),(134,'vaporeon',1.00,29.00,184,130,65,60,110,95,65,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/134.png'),(135,'jolteon',0.80,24.50,184,65,65,60,110,95,130,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/135.png'),(136,'flareon',0.90,25.00,184,65,130,60,95,110,65,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/136.png'),(137,'porygon',0.80,36.50,79,65,60,70,85,75,40,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/137.png'),(138,'omanyte',0.40,7.50,71,35,40,100,90,55,35,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/138.png'),(139,'omastar',1.00,35.00,173,70,60,125,115,70,55,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/139.png'),(140,'kabuto',0.50,11.50,71,30,80,90,55,45,55,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/140.png'),(141,'kabutops',1.30,40.50,173,60,115,105,65,70,80,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/141.png'),(142,'aerodactyl',1.80,59.00,180,80,105,65,60,75,130,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/142.png'),(143,'snorlax',2.10,460.00,189,160,110,65,65,110,30,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/143.png'),(144,'articuno',1.70,55.40,290,90,85,100,95,125,85,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/144.png'),(145,'zapdos',1.60,52.60,290,90,90,85,125,90,100,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/145.png'),(146,'moltres',2.00,60.00,290,90,100,90,125,85,90,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/146.png'),(147,'dratini',1.80,3.30,60,41,64,45,50,50,50,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/147.png'),(148,'dragonair',4.00,16.50,147,61,84,65,70,70,70,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/148.png'),(149,'dragonite',2.20,210.00,300,91,134,95,100,100,80,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/149.png'),(150,'mewtwo',2.00,122.00,340,106,110,90,154,90,130,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/150.png'),(151,'mew',0.40,4.00,300,100,100,100,100,100,100,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/151.png');
/*!40000 ALTER TABLE `Pokemon` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Pokemon_Ability`
--

DROP TABLE IF EXISTS `Pokemon_Ability`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Pokemon_Ability` (
  `pokemon_id` int NOT NULL,
  `ability_id` int NOT NULL,
  `is_hidden` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`pokemon_id`,`ability_id`),
  KEY `ability_id` (`ability_id`),
  CONSTRAINT `Pokemon_Ability_ibfk_1` FOREIGN KEY (`pokemon_id`) REFERENCES `Pokemon` (`pokemon_id`),
  CONSTRAINT `Pokemon_Ability_ibfk_2` FOREIGN KEY (`ability_id`) REFERENCES `Ability` (`ability_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Pokemon_Ability`
--

LOCK TABLES `Pokemon_Ability` WRITE;
/*!40000 ALTER TABLE `Pokemon_Ability` DISABLE KEYS */;
INSERT INTO `Pokemon_Ability` VALUES (1,34,1),(1,65,0),(2,34,1),(2,65,0),(3,34,1),(3,65,0),(4,66,0),(4,94,1),(5,66,0),(5,94,1),(6,66,0),(6,94,1),(7,44,1),(7,67,0),(8,44,1),(8,67,0),(9,44,1),(9,67,0),(10,19,0),(10,50,1),(11,61,0),(12,14,0),(12,110,1),(13,19,0),(13,50,1),(14,61,0),(15,68,0),(15,97,1),(16,51,0),(16,77,0),(16,145,1),(17,51,0),(17,77,0),(17,145,1),(18,51,0),(18,77,0),(18,145,1),(19,50,0),(19,55,1),(19,62,0),(20,50,0),(20,55,1),(20,62,0),(21,51,0),(21,97,1),(22,51,0),(22,97,1),(23,22,0),(23,61,0),(23,127,1),(24,22,0),(24,61,0),(24,127,1),(25,9,0),(25,31,1),(26,9,0),(26,31,1),(27,8,0),(27,146,1),(28,8,0),(28,146,1),(29,38,0),(29,55,1),(29,79,0),(30,38,0),(30,55,1),(30,79,0),(31,38,0),(31,79,0),(31,125,1),(32,38,0),(32,55,1),(32,79,0),(33,38,0),(33,55,1),(33,79,0),(34,38,0),(34,79,0),(34,125,1),(35,56,0),(35,98,0),(35,132,1),(36,56,0),(36,98,0),(36,109,1),(37,18,0),(37,70,1),(38,18,0),(38,70,1),(39,56,0),(39,132,1),(39,172,0),(40,56,0),(40,119,1),(40,172,0),(41,39,0),(41,151,1),(42,39,0),(42,151,1),(43,34,0),(43,50,1),(44,1,1),(44,34,0),(45,27,1),(45,34,0),(46,6,1),(46,27,0),(46,87,0),(47,6,1),(47,27,0),(47,87,0),(48,14,0),(48,50,1),(48,110,0),(49,19,0),(49,110,0),(49,147,1),(50,8,0),(50,71,0),(50,159,1),(51,8,0),(51,71,0),(51,159,1),(52,53,0),(52,101,0),(52,127,1),(53,7,0),(53,101,0),(53,127,1),(54,6,0),(54,13,0),(54,33,1),(55,6,0),(55,13,0),(55,33,1),(56,72,0),(56,83,0),(56,128,1),(57,72,0),(57,83,0),(57,128,1),(58,18,0),(58,22,0),(58,154,1),(59,18,0),(59,22,0),(59,154,1),(60,6,0),(60,11,0),(60,33,1),(61,6,0),(61,11,0),(61,33,1),(62,6,0),(62,11,0),(62,33,1),(63,28,0),(63,39,0),(63,98,1),(64,28,0),(64,39,0),(64,98,1),(65,28,0),(65,39,0),(65,98,1),(66,62,0),(66,80,1),(66,99,0),(67,62,0),(67,80,1),(67,99,0),(68,62,0),(68,80,1),(68,99,0),(69,34,0),(69,82,1),(70,34,0),(70,82,1),(71,34,0),(71,82,1),(72,29,0),(72,44,1),(72,64,0),(73,29,0),(73,44,1),(73,64,0),(74,5,0),(74,8,1),(74,69,0),(75,5,0),(75,8,1),(75,69,0),(76,5,0),(76,8,1),(76,69,0),(77,18,0),(77,49,1),(77,50,0),(78,18,0),(78,49,1),(78,50,0),(79,12,0),(79,20,0),(79,144,1),(80,12,0),(80,20,0),(80,144,1),(81,5,0),(81,42,0),(81,148,1),(82,5,0),(82,42,0),(82,148,1),(83,39,0),(83,51,0),(83,128,1),(84,48,0),(84,50,0),(84,77,1),(85,48,0),(85,50,0),(85,77,1),(86,47,0),(86,93,0),(86,115,1),(87,47,0),(87,93,0),(87,115,1),(88,1,0),(88,60,0),(88,143,1),(89,1,0),(89,60,0),(89,143,1),(90,75,0),(90,92,0),(90,142,1),(91,75,0),(91,92,0),(91,142,1),(92,26,0),(93,26,0),(94,130,0),(95,5,0),(95,69,0),(95,133,1),(96,15,0),(96,39,1),(96,108,0),(97,15,0),(97,39,1),(97,108,0),(98,52,0),(98,75,0),(98,125,1),(99,52,0),(99,75,0),(99,125,1),(100,9,0),(100,43,0),(100,106,1),(101,9,0),(101,43,0),(101,106,1),(102,34,0),(102,139,1),(103,34,0),(103,139,1),(104,4,1),(104,31,0),(104,69,0),(105,4,1),(105,31,0),(105,69,0),(106,7,0),(106,84,1),(106,120,0),(107,39,1),(107,51,0),(107,89,0),(108,12,0),(108,13,1),(108,20,0),(109,1,1),(109,26,0),(110,1,1),(110,26,0),(111,31,0),(111,69,0),(111,120,1),(112,31,0),(112,69,0),(112,120,1),(113,30,0),(113,32,0),(113,131,1),(114,34,0),(114,102,0),(114,144,1),(115,39,1),(115,48,0),(115,113,0),(116,6,1),(116,33,0),(116,97,0),(117,6,1),(117,38,0),(117,97,0),(118,31,1),(118,33,0),(118,41,0),(119,31,1),(119,33,0),(119,41,0),(120,30,0),(120,35,0),(120,148,1),(121,30,0),(121,35,0),(121,148,1),(122,43,0),(122,101,1),(122,111,0),(123,68,0),(123,80,1),(123,101,0),(124,12,0),(124,87,1),(124,108,0),(125,9,0),(125,72,1),(126,49,0),(126,72,1),(127,52,0),(127,104,0),(127,153,1),(128,22,0),(128,83,0),(128,125,1),(129,33,0),(129,155,1),(130,22,0),(130,153,1),(131,11,0),(131,75,0),(131,93,1),(132,7,0),(132,150,1),(133,50,0),(133,91,0),(133,107,1),(134,11,0),(134,93,1),(135,10,0),(135,95,1),(136,18,0),(136,62,1),(137,36,0),(137,88,0),(137,148,1),(138,33,0),(138,75,0),(138,133,1),(139,33,0),(139,75,0),(139,133,1),(140,4,0),(140,33,0),(140,133,1),(141,4,0),(141,33,0),(141,133,1),(142,46,0),(142,69,0),(142,127,1),(143,17,0),(143,47,0),(143,82,1),(144,46,0),(144,81,1),(145,9,1),(145,46,0),(146,46,0),(146,49,1),(147,61,0),(147,63,1),(148,61,0),(148,63,1),(149,39,0),(149,136,1),(150,46,0),(150,127,1),(151,28,0);
/*!40000 ALTER TABLE `Pokemon_Ability` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Pokemon_Move`
--

DROP TABLE IF EXISTS `Pokemon_Move`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Pokemon_Move` (
  `pokemon_id` int NOT NULL,
  `move_id` int NOT NULL,
  `level_learned` int DEFAULT NULL,
  PRIMARY KEY (`pokemon_id`,`move_id`),
  KEY `move_id` (`move_id`),
  CONSTRAINT `Pokemon_Move_ibfk_1` FOREIGN KEY (`pokemon_id`) REFERENCES `Pokemon` (`pokemon_id`),
  CONSTRAINT `Pokemon_Move_ibfk_2` FOREIGN KEY (`move_id`) REFERENCES `Move` (`move_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Pokemon_Move`
--

LOCK TABLES `Pokemon_Move` WRITE;
/*!40000 ALTER TABLE `Pokemon_Move` DISABLE KEYS */;
INSERT INTO `Pokemon_Move` VALUES (1,22,10),(1,33,1),(1,45,4),(1,73,7),(1,74,32),(1,75,20),(1,76,46),(1,77,15),(1,79,15),(1,230,25),(1,235,39),(2,22,10),(2,33,1),(2,45,1),(2,73,1),(2,74,38),(2,75,22),(2,76,56),(2,77,15),(2,79,15),(2,230,29),(2,235,47),(3,22,1),(3,33,1),(3,45,1),(3,73,1),(3,74,41),(3,75,22),(3,76,65),(3,77,15),(3,79,15),(3,230,29),(3,235,53),(4,10,1),(4,45,1),(4,52,7),(4,53,31),(4,82,43),(4,83,49),(4,108,19),(4,163,37),(4,184,25),(4,232,13),(5,10,1),(5,45,1),(5,52,1),(5,53,34),(5,82,48),(5,83,55),(5,108,20),(5,163,41),(5,184,27),(5,232,13),(6,10,1),(6,17,36),(6,45,1),(6,52,1),(6,53,34),(6,82,54),(6,83,64),(6,108,20),(6,163,44),(6,184,27),(6,232,1),(6,257,1),(7,33,1),(7,39,4),(7,44,18),(7,55,13),(7,56,47),(7,110,10),(7,130,40),(7,145,7),(7,182,28),(7,229,23),(7,240,33),(8,33,1),(8,39,1),(8,44,19),(8,55,13),(8,56,53),(8,110,10),(8,130,45),(8,145,1),(8,182,31),(8,229,25),(8,240,37),(9,33,1),(9,39,1),(9,44,19),(9,55,13),(9,56,68),(9,110,1),(9,130,55),(9,145,1),(9,182,31),(9,229,25),(9,240,42),(10,33,1),(10,81,1),(11,106,1),(12,16,28),(12,18,23),(12,48,18),(12,60,34),(12,77,13),(12,78,14),(12,79,15),(12,93,1),(12,219,40),(12,318,47),(13,40,1),(13,81,1),(14,106,1),(15,31,1),(15,41,20),(15,42,35),(15,97,40),(15,99,25),(15,116,15),(15,228,30),(15,283,45),(16,16,9),(16,17,25),(16,18,19),(16,28,5),(16,33,1),(16,97,39),(16,98,13),(16,119,47),(16,297,31),(17,16,1),(17,17,27),(17,18,20),(17,28,1),(17,33,1),(17,97,43),(17,98,13),(17,119,52),(17,297,34),(18,16,1),(18,17,27),(18,18,20),(18,28,1),(18,33,1),(18,97,48),(18,98,1),(18,119,62),(18,297,34),(19,33,1),(19,39,1),(19,98,7),(19,116,20),(19,158,13),(19,162,34),(19,228,27),(19,283,41),(20,33,1),(20,39,1),(20,98,1),(20,158,13),(20,162,40),(20,184,20),(20,228,30),(20,283,50),(21,31,13),(21,43,7),(21,45,1),(21,64,1),(21,65,37),(21,97,43),(21,119,31),(21,228,19),(21,332,25),(22,31,1),(22,43,1),(22,45,1),(22,64,1),(22,65,40),(22,97,47),(22,119,32),(22,228,26),(23,35,1),(23,40,8),(23,43,1),(23,44,13),(23,51,32),(23,103,25),(23,114,44),(23,137,20),(23,254,37),(23,255,37),(23,256,37),(24,35,1),(24,40,1),(24,43,1),(24,44,1),(24,51,38),(24,103,28),(24,114,56),(24,137,20),(24,254,46),(24,255,46),(24,256,46),(25,21,20),(25,39,6),(25,45,1),(25,84,1),(25,85,26),(25,86,8),(25,87,41),(25,97,33),(25,98,11),(25,104,15),(25,113,50),(26,39,1),(26,84,1),(26,85,1),(26,98,1),(27,10,1),(27,28,11),(27,40,17),(27,111,6),(27,129,30),(27,154,37),(27,163,23),(27,201,53),(27,328,45),(28,10,1),(28,28,1),(28,40,17),(28,111,1),(28,129,33),(28,154,42),(28,163,24),(28,201,62),(28,328,52),(29,10,1),(29,24,12),(29,39,8),(29,40,17),(29,44,20),(29,45,1),(29,154,30),(29,242,47),(29,260,38),(29,270,23),(30,10,1),(30,24,12),(30,39,8),(30,40,18),(30,44,22),(30,45,1),(30,154,34),(30,242,53),(30,260,43),(30,270,26),(31,10,1),(31,24,1),(31,34,22),(31,39,1),(31,40,1),(31,276,43),(32,24,12),(32,30,20),(32,31,30),(32,32,47),(32,40,17),(32,43,1),(32,64,1),(32,116,8),(32,260,38),(32,270,23),(33,24,12),(33,30,22),(33,31,34),(33,32,53),(33,40,18),(33,43,1),(33,64,1),(33,116,8),(33,260,43),(33,270,26),(34,24,1),(34,37,22),(34,40,1),(34,64,1),(34,116,1),(34,224,43),(35,1,1),(35,3,13),(35,45,1),(35,47,9),(35,107,21),(35,111,25),(35,113,41),(35,118,29),(35,227,5),(35,236,37),(35,266,17),(35,309,45),(35,322,33),(36,3,1),(36,47,1),(36,107,1),(36,118,1),(37,39,5),(37,46,9),(37,52,1),(37,53,29),(37,83,41),(37,98,13),(37,109,21),(37,219,33),(37,261,17),(37,286,25),(37,288,37),(38,52,1),(38,83,45),(38,98,1),(38,109,1),(38,219,1),(39,1,9),(39,3,24),(39,34,34),(39,38,49),(39,47,1),(39,50,14),(39,102,39),(39,111,4),(39,156,29),(39,205,19),(39,304,44),(40,3,1),(40,47,1),(40,50,1),(40,111,1),(41,17,21),(41,44,16),(41,48,11),(41,109,26),(41,114,46),(41,141,1),(41,212,36),(41,305,41),(41,310,6),(41,314,31),(42,17,21),(42,44,16),(42,48,1),(42,103,1),(42,109,28),(42,114,56),(42,141,1),(42,212,42),(42,305,49),(42,310,1),(42,314,35),(43,51,23),(43,71,1),(43,77,14),(43,78,16),(43,79,18),(43,80,39),(43,230,7),(43,236,32),(44,51,24),(44,71,1),(44,77,1),(44,78,16),(44,79,18),(44,80,44),(44,230,1),(44,236,35),(45,71,1),(45,72,1),(45,78,1),(45,80,44),(45,312,1),(46,10,1),(46,74,37),(46,77,13),(46,78,7),(46,141,19),(46,147,25),(46,163,31),(46,202,43),(46,312,49),(47,10,1),(47,74,43),(47,77,1),(47,78,1),(47,141,19),(47,147,27),(47,163,35),(47,202,51),(47,312,59),(48,33,1),(48,48,9),(48,50,1),(48,60,33),(48,77,20),(48,78,28),(48,79,36),(48,93,17),(48,94,41),(48,141,25),(48,193,1),(49,16,31),(49,33,1),(49,48,1),(49,50,1),(49,60,36),(49,77,20),(49,78,28),(49,79,42),(49,93,17),(49,94,52),(49,141,25),(49,193,1),(49,318,1),(50,10,1),(50,28,1),(50,45,5),(50,89,41),(50,90,49),(50,91,17),(50,154,21),(50,163,33),(50,189,25),(50,222,9),(51,10,1),(51,28,1),(51,45,1),(51,89,51),(51,90,64),(51,91,17),(51,154,21),(51,161,1),(51,163,38),(51,189,25),(51,222,9),(51,328,26),(52,6,18),(52,10,1),(52,44,10),(52,45,1),(52,103,31),(52,154,36),(52,163,40),(52,185,25),(52,207,45),(52,252,43),(53,6,18),(53,10,1),(53,44,1),(53,45,1),(53,103,34),(53,154,42),(53,163,49),(53,185,25),(53,207,61),(53,252,55),(54,10,1),(54,39,5),(54,50,10),(54,56,50),(54,93,16),(54,103,23),(54,154,40),(54,244,31),(54,346,1),(55,10,1),(55,39,1),(55,50,1),(55,56,58),(55,93,16),(55,103,23),(55,154,44),(55,244,31),(55,346,1),(56,2,11),(56,10,1),(56,37,46),(56,43,1),(56,67,6),(56,69,26),(56,103,41),(56,116,21),(56,154,16),(56,207,36),(56,238,31),(57,2,11),(57,10,1),(57,37,62),(57,43,1),(57,67,1),(57,69,26),(57,99,1),(57,103,53),(57,116,21),(57,154,16),(57,207,44),(57,238,35),(58,36,25),(58,43,13),(58,44,1),(58,46,1),(58,52,7),(58,53,49),(58,97,43),(58,172,31),(58,270,37),(58,316,19),(59,44,1),(59,46,1),(59,52,1),(59,245,49),(59,316,1),(60,3,19),(60,34,31),(60,55,13),(60,56,43),(60,95,7),(60,145,1),(60,187,37),(60,240,25),(61,3,19),(61,34,35),(61,55,1),(61,56,51),(61,95,1),(61,145,1),(61,187,43),(61,240,27),(62,3,1),(62,55,1),(62,66,1),(62,95,1),(62,170,51),(63,100,1),(64,50,18),(64,60,21),(64,93,1),(64,94,36),(64,100,1),(64,105,25),(64,115,23),(64,134,1),(64,248,30),(64,271,43),(64,272,33),(65,50,18),(65,60,21),(65,93,1),(65,94,36),(65,100,1),(65,105,25),(65,115,23),(65,134,1),(65,248,30),(65,271,43),(65,347,33),(66,2,13),(66,43,1),(66,66,37),(66,67,1),(66,69,19),(66,116,7),(66,184,43),(66,193,22),(66,223,49),(66,233,31),(66,238,40),(66,279,25),(67,2,13),(67,43,1),(67,66,41),(67,67,1),(67,69,19),(67,116,1),(67,184,51),(67,193,22),(67,223,59),(67,233,33),(67,238,46),(67,279,25),(68,2,13),(68,43,1),(68,66,41),(68,67,1),(68,69,19),(68,116,1),(68,184,51),(68,193,22),(68,223,59),(68,233,33),(68,238,46),(68,279,25),(69,21,45),(69,22,1),(69,35,11),(69,51,23),(69,74,6),(69,75,37),(69,77,17),(69,78,19),(69,79,15),(69,230,30),(70,21,54),(70,22,1),(70,35,1),(70,51,24),(70,74,1),(70,75,42),(70,77,17),(70,78,19),(70,79,15),(70,230,33),(71,22,1),(71,75,1),(71,79,1),(71,230,1),(71,254,1),(71,255,1),(71,256,1),(72,35,30),(72,40,1),(72,48,6),(72,51,19),(72,56,49),(72,61,25),(72,103,43),(72,112,36),(72,132,12),(73,35,30),(73,40,1),(73,48,1),(73,51,19),(73,56,55),(73,61,25),(73,103,47),(73,112,38),(73,132,1),(74,33,1),(74,38,46),(74,88,11),(74,89,36),(74,111,1),(74,120,21),(74,153,41),(74,205,26),(74,222,16),(74,300,6),(74,350,31),(75,33,1),(75,38,62),(75,88,1),(75,89,45),(75,111,1),(75,120,21),(75,153,53),(75,205,29),(75,222,16),(75,300,1),(75,350,37),(76,33,1),(76,38,62),(76,88,1),(76,89,45),(76,111,1),(76,120,21),(76,153,53),(76,205,29),(76,222,16),(76,300,1),(76,350,37),(77,23,19),(77,36,31),(77,39,9),(77,45,5),(77,52,14),(77,83,25),(77,97,38),(77,98,1),(77,126,53),(77,340,45),(78,23,19),(78,31,40),(78,36,31),(78,39,1),(78,45,1),(78,52,1),(78,83,25),(78,97,38),(78,98,1),(78,126,63),(78,340,50),(79,29,29),(79,33,1),(79,45,6),(79,50,24),(79,55,13),(79,93,17),(79,94,40),(79,133,36),(79,174,1),(79,244,47),(79,281,1),(80,29,29),(80,33,1),(80,45,1),(80,50,24),(80,55,13),(80,93,17),(80,94,44),(80,110,37),(80,133,36),(80,174,1),(80,244,55),(80,281,1),(81,33,1),(81,48,11),(81,49,16),(81,84,6),(81,86,21),(81,103,44),(81,129,38),(81,192,50),(81,199,32),(81,209,26),(81,319,1),(82,33,1),(82,48,1),(82,49,16),(82,84,1),(82,86,21),(82,103,53),(82,161,44),(82,192,62),(82,199,35),(82,209,26),(82,319,1),(83,14,31),(83,28,6),(83,31,16),(83,43,11),(83,64,1),(83,97,36),(83,163,41),(83,206,46),(83,210,26),(83,282,21),(84,31,13),(84,45,1),(84,64,1),(84,65,37),(84,97,45),(84,99,25),(84,161,21),(84,228,9),(84,253,33),(85,31,1),(85,45,1),(85,64,1),(85,65,47),(85,97,60),(85,99,25),(85,161,21),(85,228,1),(85,253,38),(86,29,1),(86,36,37),(86,45,9),(86,58,41),(86,62,21),(86,156,29),(86,196,17),(86,219,49),(87,29,1),(87,36,42),(87,45,1),(87,58,51),(87,62,1),(87,156,29),(87,196,1),(87,219,64),(87,324,1),(87,329,34),(88,1,1),(88,50,8),(88,103,26),(88,106,4),(88,107,19),(88,124,13),(88,139,1),(88,151,34),(88,188,43),(88,262,53),(89,1,1),(89,50,8),(89,103,26),(89,106,1),(89,107,19),(89,124,13),(89,139,1),(89,151,34),(89,188,47),(89,262,61),(90,33,1),(90,43,36),(90,48,15),(90,58,50),(90,62,22),(90,110,1),(90,128,43),(90,182,29),(90,333,8),(91,48,1),(91,62,1),(91,110,1),(91,131,43),(91,182,1),(91,191,36),(92,95,1),(92,101,16),(92,109,21),(92,122,1),(92,138,28),(92,171,41),(92,174,13),(92,180,8),(92,194,33),(92,212,48),(92,247,36),(93,95,1),(93,101,16),(93,109,21),(93,122,1),(93,138,31),(93,171,53),(93,174,13),(93,180,1),(93,194,39),(93,212,64),(93,247,45),(93,325,25),(94,95,1),(94,101,16),(94,109,21),(94,122,1),(94,138,31),(94,171,53),(94,174,13),(94,180,1),(94,194,39),(94,212,64),(94,247,45),(94,325,25),(95,20,8),(95,21,41),(95,33,1),(95,38,56),(95,88,12),(95,99,23),(95,103,1),(95,106,19),(95,201,34),(95,225,30),(95,231,45),(95,328,52),(96,1,1),(96,29,17),(96,50,7),(96,93,11),(96,94,31),(96,95,1),(96,96,27),(96,139,21),(96,207,41),(96,244,37),(96,248,47),(97,1,1),(97,29,17),(97,50,1),(97,93,1),(97,94,35),(97,95,1),(97,96,29),(97,139,21),(97,171,1),(97,207,49),(97,244,43),(97,248,57),(98,11,12),(98,12,34),(98,23,27),(98,43,5),(98,106,16),(98,145,1),(98,152,45),(98,175,49),(98,182,38),(98,341,23),(99,11,1),(99,12,38),(99,23,27),(99,43,1),(99,106,1),(99,145,1),(99,152,57),(99,175,65),(99,182,42),(99,232,1),(99,341,23),(100,33,1),(100,49,15),(100,103,8),(100,113,37),(100,120,27),(100,129,42),(100,153,46),(100,205,32),(100,209,21),(100,243,49),(100,268,1),(101,33,1),(101,49,1),(101,103,1),(101,113,41),(101,120,27),(101,129,48),(101,153,54),(101,205,34),(101,209,21),(101,243,59),(101,268,1),(102,73,13),(102,76,43),(102,77,31),(102,78,25),(102,79,37),(102,93,19),(102,95,1),(102,115,7),(102,140,1),(102,253,1),(103,23,19),(103,93,1),(103,95,1),(103,121,31),(103,140,1),(104,29,13),(104,37,37),(104,38,45),(104,39,5),(104,43,17),(104,45,1),(104,99,29),(104,116,21),(104,125,9),(104,155,25),(104,198,41),(104,206,33),(105,29,1),(105,37,46),(105,38,61),(105,39,1),(105,43,17),(105,45,1),(105,99,32),(105,116,21),(105,125,1),(105,155,25),(105,198,53),(105,206,39),(106,24,1),(106,25,46),(106,26,16),(106,27,11),(106,96,6),(106,116,21),(106,136,26),(106,170,31),(106,179,51),(106,193,36),(106,203,41),(106,279,1),(106,280,20),(107,4,1),(107,5,38),(107,7,26),(107,8,26),(107,9,26),(107,68,50),(107,97,7),(107,183,20),(107,197,44),(107,228,13),(107,279,1),(107,327,32),(108,21,40),(108,23,23),(108,35,29),(108,48,7),(108,50,34),(108,103,45),(108,111,12),(108,122,1),(108,282,18),(108,287,51),(109,33,1),(109,108,25),(109,114,33),(109,120,17),(109,123,9),(109,124,21),(109,139,1),(109,153,41),(109,194,45),(109,262,49),(110,33,1),(110,108,25),(110,114,33),(110,120,1),(110,123,1),(110,124,21),(110,139,1),(110,153,44),(110,194,51),(110,262,58),(111,23,10),(111,30,1),(111,31,15),(111,32,38),(111,36,43),(111,39,1),(111,89,52),(111,184,24),(111,224,57),(111,350,29),(112,23,1),(112,30,1),(112,31,1),(112,32,38),(112,36,46),(112,39,1),(112,89,58),(112,184,24),(112,224,66),(112,350,29),(113,1,1),(113,3,17),(113,38,57),(113,39,5),(113,45,1),(113,47,29),(113,107,23),(113,111,41),(113,113,49),(113,121,35),(113,135,13),(113,287,9),(114,20,28),(114,21,40),(114,22,22),(114,71,10),(114,72,31),(114,74,13),(114,77,19),(114,78,37),(114,79,4),(114,132,1),(114,275,1),(114,321,46),(115,4,1),(115,5,25),(115,39,13),(115,43,1),(115,44,7),(115,99,31),(115,146,43),(115,179,49),(115,203,37),(115,252,19),(116,43,15),(116,55,22),(116,56,43),(116,97,36),(116,108,8),(116,145,1),(116,239,29),(116,349,50),(117,43,1),(117,55,1),(117,56,51),(117,97,40),(117,108,1),(117,145,1),(117,239,29),(117,349,62),(118,30,15),(118,31,29),(118,32,43),(118,39,1),(118,48,10),(118,64,1),(118,97,52),(118,127,38),(118,175,24),(118,224,57),(118,346,1),(119,30,15),(119,31,29),(119,32,49),(119,39,1),(119,48,1),(119,64,1),(119,97,61),(119,127,41),(119,175,24),(119,224,69),(119,346,1),(120,33,1),(120,55,6),(120,56,46),(120,61,28),(120,105,15),(120,106,1),(120,107,33),(120,113,37),(120,129,24),(120,229,10),(120,293,19),(120,322,42),(121,55,1),(121,105,1),(121,109,33),(121,129,1),(121,229,1),(122,3,15),(122,60,29),(122,93,5),(122,94,43),(122,96,12),(122,112,1),(122,113,19),(122,115,19),(122,164,8),(122,219,50),(122,226,47),(122,227,26),(122,271,36),(122,272,40),(122,278,33),(122,345,22),(123,14,36),(123,17,26),(123,43,1),(123,97,21),(123,98,1),(123,104,41),(123,116,6),(123,163,31),(123,206,16),(123,210,46),(123,228,11),(124,1,1),(124,3,21),(124,8,25),(124,34,51),(124,59,67),(124,122,1),(124,142,1),(124,181,1),(124,195,57),(124,212,35),(124,313,41),(125,9,1),(125,43,1),(125,85,47),(125,87,58),(125,98,1),(125,103,36),(125,113,17),(125,129,25),(126,7,1),(126,43,1),(126,52,1),(126,53,41),(126,108,25),(126,109,49),(126,123,1),(126,126,57),(126,241,33),(127,11,1),(127,12,37),(127,14,49),(127,20,7),(127,66,43),(127,69,13),(127,106,19),(127,116,1),(127,279,25),(127,280,31),(128,30,8),(128,33,1),(128,36,53),(128,37,43),(128,39,1),(128,99,4),(128,156,34),(128,184,13),(128,207,26),(128,228,19),(129,33,15),(129,150,1),(129,175,30),(130,37,1),(130,43,30),(130,44,20),(130,56,40),(130,63,55),(130,82,25),(130,239,35),(130,240,45),(130,349,50),(131,34,13),(131,45,1),(131,47,1),(131,54,7),(131,55,1),(131,56,49),(131,58,31),(131,109,19),(131,195,25),(131,219,43),(131,240,37),(131,329,55),(132,144,1),(133,28,8),(133,33,1),(133,36,42),(133,39,1),(133,44,30),(133,45,16),(133,98,23),(133,226,36),(133,270,1),(134,28,8),(134,33,1),(134,39,1),(134,44,30),(134,55,16),(134,56,52),(134,62,36),(134,98,23),(134,114,42),(134,151,47),(134,270,1),(135,24,30),(135,28,8),(135,33,1),(135,39,1),(135,42,36),(135,84,16),(135,86,42),(135,87,52),(135,97,47),(135,98,23),(135,270,1),(136,28,8),(136,33,1),(136,39,1),(136,43,47),(136,44,30),(136,52,16),(136,53,52),(136,83,36),(136,98,23),(136,123,42),(136,270,1),(137,33,1),(137,60,12),(137,97,9),(137,105,20),(137,159,24),(137,160,1),(137,161,36),(137,176,1),(137,192,48),(137,199,32),(137,278,44),(138,43,31),(138,44,13),(138,55,19),(138,56,55),(138,110,1),(138,132,1),(138,182,37),(138,246,49),(138,321,43),(138,341,25),(139,43,31),(139,44,1),(139,55,1),(139,56,65),(139,110,1),(139,131,40),(139,132,1),(139,182,37),(139,246,55),(139,321,46),(139,341,25),(140,10,1),(140,28,31),(140,43,19),(140,71,13),(140,72,49),(140,106,1),(140,203,37),(140,246,55),(140,319,43),(140,341,25),(141,10,1),(141,28,31),(141,43,1),(141,71,1),(141,72,55),(141,106,1),(141,163,40),(141,203,37),(141,210,1),(141,246,65),(141,319,46),(141,341,25),(142,17,1),(142,36,43),(142,44,15),(142,48,22),(142,63,50),(142,97,8),(142,184,36),(142,246,29),(143,29,17),(143,33,1),(143,34,33),(143,63,53),(143,111,9),(143,133,5),(143,156,25),(143,173,29),(143,187,13),(143,205,49),(143,214,37),(143,281,21),(143,335,41),(143,343,45),(144,16,1),(144,54,13),(144,58,49),(144,59,73),(144,97,25),(144,115,61),(144,170,37),(144,181,1),(144,329,85),(145,64,1),(145,65,49),(145,84,1),(145,86,13),(145,87,85),(145,97,25),(145,113,73),(145,197,37),(145,268,61),(146,17,1),(146,52,1),(146,53,49),(146,83,13),(146,97,25),(146,143,85),(146,203,37),(146,219,61),(146,257,73),(147,21,29),(147,35,1),(147,43,1),(147,63,57),(147,82,22),(147,86,8),(147,97,36),(147,200,50),(147,219,43),(147,239,15),(148,21,29),(148,35,1),(148,43,1),(148,63,65),(148,82,22),(148,86,1),(148,97,38),(148,200,56),(148,219,47),(148,239,1),(149,17,55),(149,21,29),(149,35,1),(149,43,1),(149,63,75),(149,82,22),(149,86,1),(149,97,38),(149,200,61),(149,219,47),(149,239,1),(150,50,1),(150,54,22),(150,93,1),(150,94,66),(150,105,44),(150,112,11),(150,129,33),(150,133,99),(150,219,55),(150,244,77),(150,248,88),(151,1,1),(151,5,20),(151,94,40),(151,118,30),(151,144,10),(151,246,50);
/*!40000 ALTER TABLE `Pokemon_Move` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Pokemon_Type`
--

DROP TABLE IF EXISTS `Pokemon_Type`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Pokemon_Type` (
  `pokemon_id` int NOT NULL,
  `type_id` int NOT NULL,
  PRIMARY KEY (`pokemon_id`,`type_id`),
  KEY `type_id` (`type_id`),
  CONSTRAINT `Pokemon_Type_ibfk_1` FOREIGN KEY (`pokemon_id`) REFERENCES `Pokemon` (`pokemon_id`),
  CONSTRAINT `Pokemon_Type_ibfk_2` FOREIGN KEY (`type_id`) REFERENCES `Type` (`type_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Pokemon_Type`
--

LOCK TABLES `Pokemon_Type` WRITE;
/*!40000 ALTER TABLE `Pokemon_Type` DISABLE KEYS */;
INSERT INTO `Pokemon_Type` VALUES (16,1),(17,1),(18,1),(19,1),(20,1),(21,1),(22,1),(39,1),(40,1),(52,1),(53,1),(83,1),(84,1),(85,1),(108,1),(113,1),(115,1),(128,1),(132,1),(133,1),(137,1),(143,1),(4,2),(5,2),(6,2),(37,2),(38,2),(58,2),(59,2),(77,2),(78,2),(126,2),(136,2),(146,2),(7,3),(8,3),(9,3),(54,3),(55,3),(60,3),(61,3),(62,3),(72,3),(73,3),(79,3),(80,3),(86,3),(87,3),(90,3),(91,3),(98,3),(99,3),(116,3),(117,3),(118,3),(119,3),(120,3),(121,3),(129,3),(130,3),(131,3),(134,3),(138,3),(139,3),(140,3),(141,3),(1,4),(2,4),(3,4),(43,4),(44,4),(45,4),(46,4),(47,4),(69,4),(70,4),(71,4),(102,4),(103,4),(114,4),(25,5),(26,5),(81,5),(82,5),(100,5),(101,5),(125,5),(135,5),(145,5),(87,6),(91,6),(124,6),(131,6),(144,6),(56,7),(57,7),(62,7),(66,7),(67,7),(68,7),(106,7),(107,7),(1,8),(2,8),(3,8),(13,8),(14,8),(15,8),(23,8),(24,8),(29,8),(30,8),(31,8),(32,8),(33,8),(34,8),(41,8),(42,8),(43,8),(44,8),(45,8),(48,8),(49,8),(69,8),(70,8),(71,8),(72,8),(73,8),(88,8),(89,8),(92,8),(93,8),(94,8),(109,8),(110,8),(27,9),(28,9),(31,9),(34,9),(50,9),(51,9),(74,9),(75,9),(76,9),(95,9),(104,9),(105,9),(111,9),(112,9),(6,10),(12,10),(16,10),(17,10),(18,10),(21,10),(22,10),(41,10),(42,10),(83,10),(84,10),(85,10),(123,10),(130,10),(142,10),(144,10),(145,10),(146,10),(149,10),(63,11),(64,11),(65,11),(79,11),(80,11),(96,11),(97,11),(102,11),(103,11),(121,11),(122,11),(124,11),(150,11),(151,11),(10,12),(11,12),(12,12),(13,12),(14,12),(15,12),(46,12),(47,12),(48,12),(49,12),(123,12),(127,12),(74,13),(75,13),(76,13),(95,13),(111,13),(112,13),(138,13),(139,13),(140,13),(141,13),(142,13),(92,14),(93,14),(94,14),(147,15),(148,15),(149,15),(81,17),(82,17),(35,18),(36,18),(39,18),(40,18),(122,18);
/*!40000 ALTER TABLE `Pokemon_Type` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Type`
--

DROP TABLE IF EXISTS `Type`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Type` (
  `type_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  PRIMARY KEY (`type_id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=1000 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Type`
--

LOCK TABLES `Type` WRITE;
/*!40000 ALTER TABLE `Type` DISABLE KEYS */;
INSERT INTO `Type` VALUES (12,'Bug'),(16,'Dark'),(15,'Dragon'),(5,'Electric'),(18,'Fairy'),(7,'Fighting'),(2,'Fire'),(10,'Flying'),(14,'Ghost'),(4,'Grass'),(9,'Ground'),(6,'Ice'),(1,'Normal'),(8,'Poison'),(11,'Psychic'),(13,'Rock'),(17,'Steel'),(3,'Water');
/*!40000 ALTER TABLE `Type` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pokemon_species`
--

DROP TABLE IF EXISTS `pokemon_species`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pokemon_species` (
  `pokemon_id` int NOT NULL,
  `category` varchar(100) NOT NULL,
  `flavor_text` text NOT NULL,
  PRIMARY KEY (`pokemon_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pokemon_species`
--

LOCK TABLES `pokemon_species` WRITE;
/*!40000 ALTER TABLE `pokemon_species` DISABLE KEYS */;
INSERT INTO `pokemon_species` VALUES (1,'Seed Pok├⌐mon','A strange seed was planted on its back at birth. The plant sprouts and grows with this POK├⌐MON.'),(2,'Seed Pok├⌐mon','When the bulb on its back grows large, it appears to lose the ability to stand on its hind legs.'),(3,'Seed Pok├⌐mon','The plant blooms when it is absorbing solar energy. It stays on the move to seek sunlight.'),(4,'Lizard Pok├⌐mon','Obviously prefers hot places. When it rains, steam is said to spout from the tip of its tail.'),(5,'Flame Pok├⌐mon','When it swings its burning tail, it elevates the temperature to unbearably high levels.'),(6,'Flame Pok├⌐mon','Spits fire that is hot enough to melt boulders. Known to cause forest fires unintentionally.'),(7,'Tiny Turtle Pok├⌐mon','After birth, its back swells and hardens into a shell. Powerfully sprays foam from its mouth.'),(8,'Turtle Pok├⌐mon','Often hides in water to stalk unwary prey. For swimming fast, it moves its ears to maintain balance.'),(9,'Shellfish Pok├⌐mon','A brutal POK├⌐MON with pressurized water jets on its shell. They are used for high speed tackles.'),(10,'Worm Pok├⌐mon','Its short feet are tipped with suction pads that enable it to tirelessly climb slopes and walls.'),(11,'Cocoon Pok├⌐mon','This POK├⌐MON is vulnerable to attack while its shell is soft, exposing its weak and tender body.'),(12,'Butterfly Pok├⌐mon','In battle, it flaps its wings at high speed to release highly toxic dust into the air.'),(13,'Hairy Bug Pok├⌐mon','Often found in forests, eating leaves. It has a sharp venomous stinger on its head.'),(14,'Cocoon Pok├⌐mon','Almost incapable of moving, this POK├⌐MON can only harden its shell to protect itself from predators.'),(15,'Poison Bee Pok├⌐mon','It has three poisonous stingers on its forelegs and its tail. They are used to jab its enemy repeatedly.'),(16,'Tiny Bird Pok├⌐mon','A common sight in forests and woods. It flaps its wings at ground level to kick up blinding sand.'),(17,'Bird Pok├⌐mon','Very protective of its sprawling territorial area, this POK├⌐MON will fiercely peck at any intruder.'),(18,'Bird Pok├⌐mon','When hunting, it skims the surface of water at high speed to pick off unwary prey such as MAGIKARP.'),(19,'Mouse Pok├⌐mon','Bites anything when it attacks. Small and very quick, it is a common sight in many places.'),(20,'Mouse Pok├⌐mon','It uses its whis┬¡ kers to maintain its balance. It apparently slows down if they are cut off.'),(21,'Tiny Bird Pok├⌐mon','It flaps its small wings busily to fly. Using its beak, it searches in grass for prey.'),(22,'Beak Pok├⌐mon','With its huge and magnificent wings, it can keep aloft without ever having to land for rest.'),(23,'Snake Pok├⌐mon','Moves silently and stealthily. Eats the eggs of birds, such as PIDGEY and SPEAROW, whole.'),(24,'Cobra Pok├⌐mon','It is rumored that the ferocious warning markings on its belly differ from area to area.'),(25,'Mouse Pok├⌐mon','When several of these POK├⌐MON gather, their electricity could build and cause lightning storms.'),(26,'Mouse Pok├⌐mon','Its long tail serves as a ground to protect itself from its own high-voltage power.'),(27,'Mouse Pok├⌐mon','Burrows deep underground in arid locations far from water. It only emerges to hunt for food.'),(28,'Mouse Pok├⌐mon','Curls up into a spiny ball when threatened. It can roll while curled up to attack or escape.'),(29,'Poison Pin Pok├⌐mon','Although small, its venomous barbs render this POK├⌐MON dangerous. The female has smaller horns.'),(30,'Poison Pin Pok├⌐mon','The female\'s horn develops slowly. Prefers physical attacks such as clawing and biting.'),(31,'Drill Pok├⌐mon','Its hard scales provide strong protection. It uses its hefty bulk to execute powerful moves.'),(32,'Poison Pin Pok├⌐mon','Stiffens its ears to sense danger. The larger its horns, the more powerful its secreted venom.'),(33,'Poison Pin Pok├⌐mon','An aggressive POK├⌐MON that is quick to attack. The horn on its head secretes a powerful venom.'),(34,'Drill Pok├⌐mon','It uses its powerful tail in battle to smash, constrict, then break the prey\'s bones.'),(35,'Fairy Pok├⌐mon','Its magical and cute appeal has many admirers. It is rare and found only in certain areas.'),(36,'Fairy Pok├⌐mon','A timid fairy POK├⌐MON that is rarely seen. It will run and hide the moment it senses people.'),(37,'Fox Pok├⌐mon','At the time of birth, it has just one tail. The tail splits from its tip as it grows older.'),(38,'Fox Pok├⌐mon','Very smart and very vengeful. Grabbing one of its many tails could result in a 1000-year curse.'),(39,'Balloon Pok├⌐mon','When its huge eyes light up, it sings a mysteriously soothing melody that lulls its enemies to sleep.'),(40,'Balloon Pok├⌐mon','The body is soft and rubbery. When angered, it will suck in air and inflate itself to an enormous size.'),(41,'Bat Pok├⌐mon','Forms colonies in perpetually dark places. Uses ultrasonic waves to identify and approach targets.'),(42,'Bat Pok├⌐mon','Once it strikes, it will not stop draining energy from the victim even if it gets too heavy to fly.'),(43,'Weed Pok├⌐mon','During the day, it keeps its face buried in the ground. At night, it wanders around sowing its seeds.'),(44,'Weed Pok├⌐mon','The fluid that oozes from its mouth isn\'t drool. It is a nectar that is used to attract prey.'),(45,'Flower Pok├⌐mon','It has the worldΓÇÖs largest petals. With every step, the petals shake out heavy clouds of toxic pollen.'),(46,'Mushroom Pok├⌐mon','Burrows to suck tree roots. The mushrooms on its back grow by draw┬¡ ing nutrients from the bug host.'),(47,'Mushroom Pok├⌐mon','A host-parasite pair in which the parasite mushroom has taken over the host bug. Prefers damp places.'),(48,'Insect Pok├⌐mon','Lives in the shadows of tall trees where it eats insects. It is attracted by light at night.'),(49,'Poison Moth Pok├⌐mon','The dustlike scales covering its wings are color-coded to indicate the kinds of poison it has.'),(50,'Mole Pok├⌐mon','Lives about one yard underground where it feeds on plant roots. It sometimes appears above ground.'),(51,'Mole Pok├⌐mon','A team of DIGLETT triplets. It triggers huge earthquakes by burrowing 60 miles underground.'),(52,'Scratch Cat Pok├⌐mon','It washes its face regularly to keep the coin on its forehead spotless. It doesnΓÇÖt get along with Galarian Meowth.'),(53,'Classy Cat Pok├⌐mon','Although its fur has many admirers, it is tough to raise as a pet because of its fickle meanness.'),(54,'Duck Pok├⌐mon','While lulling its enemies with its vacant look, this wily POK├⌐MON will use psychokinetic powers.'),(55,'Duck Pok├⌐mon','Often seen swim┬¡ ming elegantly by lake shores. It is often mistaken for the Japanese monster, Kappa.'),(56,'Pig Monkey Pok├⌐mon','Extremely quick to anger. It could be docile one moment then thrashing away the next instant.'),(57,'Pig Monkey Pok├⌐mon','Always furious and tenacious to boot. It will not abandon chasing its quarry until it is caught.'),(58,'Puppy Pok├⌐mon','Very protective of its territory. It will bark and bite to repel intruders from its space.'),(59,'Legendary Pok├⌐mon','A POK├⌐MON that has been admired since the past for its beauty. It runs agilely as if on wings.'),(60,'Tadpole Pok├⌐mon','Its newly grown legs prevent it from running. It appears to prefer swimming than trying to stand.'),(61,'Tadpole Pok├⌐mon','Capable of living in or out of water. When out of water, it sweats to keep its body slimy.'),(62,'Tadpole Pok├⌐mon','An adept swimmer at both the front crawl and breast stroke. Easily overtakes the best human swimmers.'),(63,'Psi Pok├⌐mon','Using its ability to read minds, it will identify impending danger and TELEPORT to safety.'),(64,'Psi Pok├⌐mon','It emits special alpha waves from its body that induce headaches just by being close by.'),(65,'Psi Pok├⌐mon','Its brain can out┬¡ perform a super┬¡ computer. Its intelligence quotient is said to be 5,000.'),(66,'Superpower Pok├⌐mon','Loves to build its muscles. It trains in all styles of martial arts to become even stronger.'),(67,'Superpower Pok├⌐mon','Its muscular body is so powerful, it must wear a power save belt to be able to regulate its motions.'),(68,'Superpower Pok├⌐mon','Using its heavy muscles, it throws powerful punches that can send the victim clear over the horizon.'),(69,'Flower Pok├⌐mon','A carnivorous POK├⌐MON that traps and eats bugs. It uses its root feet to soak up needed moisture.'),(70,'Flycatcher Pok├⌐mon','It spits out POISONPOWDER to immobilize the enemy and then finishes it with a spray of ACID.'),(71,'Flycatcher Pok├⌐mon','Said to live in huge colonies deep in jungles, although no one has ever returned from there.'),(72,'Jellyfish Pok├⌐mon','Drifts in shallow seas. Anglers who hook them by accident are often punished by its stinging acid.'),(73,'Jellyfish Pok├⌐mon','The tentacles are normally kept short. On hunts, they are extended to ensnare and immobilize prey.'),(74,'Rock Pok├⌐mon','Found in fields and mountains. Mistaking them for boulders, people often step or trip on them.'),(75,'Rock Pok├⌐mon','Rolls down slopes to move. It rolls over any obstacle without slowing or changing its direction.'),(76,'Megaton Pok├⌐mon','Its boulder-like body is extremely hard. It can easily withstand dynamite blasts without damage.'),(77,'Fire Horse Pok├⌐mon','Its hooves are 10 times harder than diamonds. It can trample anything completely flat in little time.'),(78,'Fire Horse Pok├⌐mon','Very competitive, this POK├⌐MON will chase anything that moves fast in the hopes of racing it.'),(79,'Dopey Pok├⌐mon','Incredibly slow and dopey. It takes 5 seconds for it to feel pain when under attack.'),(80,'Hermit Crab Pok├⌐mon','The SHELLDER that is latched onto SLOWPOKE\'s tail is said to feed on the host\'s left over scraps.'),(81,'Magnet Pok├⌐mon','Uses anti-gravity to stay suspended. Appears without warning and uses THUNDER WAVE and similar moves.'),(82,'Magnet Pok├⌐mon','Formed by several MAGNEMITEs linked together. They frequently appear when sunspots flare up.'),(83,'Wild Duck Pok├⌐mon','The sprig of green onions it holds is its weapon. It is used much like a metal sword.'),(84,'Twin Bird Pok├⌐mon','A bird that makes up for its poor flying with its fast foot speed. Leaves giant footprints.'),(85,'Triple Bird Pok├⌐mon','Uses its three brains to execute complex plans. While two heads sleep, one head stays awake.'),(86,'Sea Lion Pok├⌐mon','The protruding horn on its head is very hard. It is used for bashing through thick ice.'),(87,'Sea Lion Pok├⌐mon','Stores thermal energy in its body. Swims at a steady 8 knots even in intensely cold waters.'),(88,'Sludge Pok├⌐mon','Appears in filthy areas. Thrives by sucking up polluted sludge that is pumped out of factories.'),(89,'Sludge Pok├⌐mon','Thickly covered with a filthy, vile sludge. It is so toxic, even its footprints contain poison.'),(90,'Bivalve Pok├⌐mon','Its hard shell repels any kind of attack. It is vulnerable only when its shell is open.'),(91,'Bivalve Pok├⌐mon','When attacked, it launches its horns in quick volleys. Its innards have never been seen.'),(92,'Gas Pok├⌐mon','Almost invisible, this gaseous POK├⌐MON cloaks the target and puts it to sleep without notice.'),(93,'Gas Pok├⌐mon','Because of its ability to slip through block walls, it is said to be from an┬¡ other dimension.'),(94,'Shadow Pok├⌐mon','Under a full moon, this POK├⌐MON likes to mimic the shadows of people and laugh at their fright.'),(95,'Rock Snake Pok├⌐mon','As it grows, the stone portions of its body harden to become similar to a diamond, but colored black.'),(96,'Hypnosis Pok├⌐mon','Puts enemies to sleep then eats their dreams. Occasionally gets sick from eating bad dreams.'),(97,'Hypnosis Pok├⌐mon','When it locks eyes with an enemy, it will use a mix of PSI moves such as HYPNOSIS and CONFUSION.'),(98,'River Crab Pok├⌐mon','Its pincers are not only powerful weapons, they are used for balance when walking sideways.'),(99,'Pincer Pok├⌐mon','The large pincer has 10000 hp of crushing power. However, its huge size makes it unwieldy to use.'),(100,'Ball Pok├⌐mon','Usually found in power plants. Easily mistaken for a POK├⌐ BALL, they have zapped many people.'),(101,'Ball Pok├⌐mon','It stores electric energy under very high pressure. It often explodes with little or no provocation.'),(102,'Egg Pok├⌐mon','Often mistaken for eggs. When disturbed, they quickly gather and attack in swarms.'),(103,'Coconut Pok├⌐mon','Legend has it that on rare occasions, one of its heads will drop off and continue on as an EXEGGCUTE.'),(104,'Lonely Pok├⌐mon','Because it never removes its skull helmet, no one has ever seen this POK├⌐MON\'s real face.'),(105,'Bone Keeper Pok├⌐mon','The bone it holds is its key weapon. It throws the bone skillfully like a boomerang to KO targets.'),(106,'Kicking Pok├⌐mon','When in a hurry, its legs lengthen progressively. It runs smoothly with extra long, loping strides.'),(107,'Punching Pok├⌐mon','While apparently doing nothing, it fires punches in lightning fast volleys that are impossible to see.'),(108,'Licking Pok├⌐mon','Its tongue can be extended like a chameleon\'s. It leaves a tingling sensation when it licks enemies.'),(109,'Poison Gas Pok├⌐mon','Because it stores several kinds of toxic gases in its body, it is prone to exploding without warning.'),(110,'Poison Gas Pok├⌐mon','Where two kinds of poison gases meet, 2 KOFFINGs can fuse into a WEEZING over many years.'),(111,'Spikes Pok├⌐mon','A POK├⌐MON with a one-track mind. Once it charges,  it won\'t stop running until it falls asleep.'),(112,'Drill Pok├⌐mon','Protected by an armor-like hide, it is capable of living in molten lava of 3,600 degrees.'),(113,'Egg Pok├⌐mon','A rare and elusive POK├⌐MON that is said to bring happiness to those who manage to get it.'),(114,'Vine Pok├⌐mon','The whole body is swathed with wide vines that are similar to sea┬¡ weed. Its vines shake as it walks.'),(115,'Parent Pok├⌐mon','The infant rarely ventures out of its mother\'s protective pouch until it is 3 years old.'),(116,'Dragon Pok├⌐mon','Known to shoot down flying bugs with precision blasts of ink from the surface of the water.'),(117,'Dragon Pok├⌐mon','Capable of swim┬¡ ming backwards by rapidly flapping its wing-like pectoral fins and stout tail.'),(118,'Goldfish Pok├⌐mon','Its tail fin billows like an elegant ballroom dress, giving it the nickname of the Water Queen.'),(119,'Goldfish Pok├⌐mon','In the autumn spawning season, they can be seen swimming powerfully up rivers and creeks.'),(120,'Star Shape Pok├⌐mon','If its body is torn, it can grow back if the red core remains. The core flashes at midnight.'),(121,'Mysterious Pok├⌐mon','Its central core glows with the seven colors of the rainbow. Some people value the core as a gem.'),(122,'Barrier Pok├⌐mon','If interrupted while it is miming, it will slap around the offender with its broad hands.'),(123,'Mantis Pok├⌐mon','With ninja-like agility and speed, it can create the illusion that there is more than one.'),(124,'Human Shape Pok├⌐mon','It seductively wiggles its hips as it walks. It can cause people to dance in unison with it.'),(125,'Electric Pok├⌐mon','Normally found near power plants, they can wander away and cause major blackouts in cities.'),(126,'Spitfire Pok├⌐mon','Its body always burns with an orange glow that enables it to hide perfectly among flames.'),(127,'Stag Beetle Pok├⌐mon','If it fails to crush the victim in its pincers, it will swing it around and toss it hard.'),(128,'Wild Bull Pok├⌐mon','When it targets an enemy, it charges furiously while whipping its body with its long tails.'),(129,'Fish Pok├⌐mon','In the distant past, it was somewhat stronger than the horribly weak descendants that exist today.'),(130,'Atrocious Pok├⌐mon','Once it begins to rampage, a GYARADOS will burn everything down, even in a harsh storm.'),(131,'Transport Pok├⌐mon','A POK├⌐MON that has been over┬¡ hunted almost to extinction. It can ferry people across the water.'),(132,'Transform Pok├⌐mon','Capable of copying an enemy\'s genetic code to instantly transform itself into a duplicate of the enemy.'),(133,'Evolution Pok├⌐mon','Its genetic code is irregular. It may mutate if it is exposed to radiation from element STONEs.'),(134,'Bubble Jet Pok├⌐mon','Lives close to water. Its long tail is ridged with a fin which is often mistaken for a mermaid\'s.'),(135,'Lightning Pok├⌐mon','It accumulates negative ions in the atmosphere to blast out 10000- volt lightning bolts.'),(136,'Flame Pok├⌐mon','When storing thermal energy in its body, its temperature could soar to over 1600 degrees.'),(137,'Virtual Pok├⌐mon','A POK├⌐MON that consists entirely of programming code. Capable of moving freely in cyberspace.'),(138,'Spiral Pok├⌐mon','Although long extinct, in rare cases, it can be genetically resurrected from fossils.'),(139,'Spiral Pok├⌐mon','A prehistoric POK├⌐MON that died out when its heavy shell made it impossible to catch prey.'),(140,'Shellfish Pok├⌐mon','A POK├⌐MON that was resurrected from a fossil found in what was once the ocean floor eons ago.'),(141,'Shellfish Pok├⌐mon','Its sleek shape is perfect for swim┬¡ ming. It slashes prey with its claws and drains the body fluids.'),(142,'Fossil Pok├⌐mon','A Pok├⌐mon that roamed the skies in the dinosaur era. Its teeth are like saw blades.'),(143,'Sleeping Pok├⌐mon','Very lazy. Just eats and sleeps. As its rotund bulk builds, it becomes steadily more slothful.'),(144,'Freeze Pok├⌐mon','A legendary bird POK├⌐MON that is said to appear to doomed people who are lost in icy mountains.'),(145,'Electric Pok├⌐mon','A legendary bird POK├⌐MON that is said to appear from clouds while dropping enormous lightning bolts.'),(146,'Flame Pok├⌐mon','Known as the legendary bird of fire. Every flap of its wings creates a dazzling flash of flames.'),(147,'Dragon Pok├⌐mon','Long considered a mythical POK├⌐MON until recently when a small colony was found living underwater.'),(148,'Dragon Pok├⌐mon','A mystical POK├⌐MON that exudes a gentle aura. Has the ability to change climate conditions.'),(149,'Dragon Pok├⌐mon','An extremely rarely seen marine POK├⌐MON. Its intelligence is said to match that of humans.'),(150,'Genetic Pok├⌐mon','It was created by a scientist after years of horrific gene splicing and DNA engineering experiments.'),(151,'New Species Pok├⌐mon','So rare that it is still said to be a mirage by many experts. Only a few people have seen it worldwide.');
/*!40000 ALTER TABLE `pokemon_species` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pokemon_genders`
--

DROP TABLE IF EXISTS `pokemon_genders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pokemon_genders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `pokemon_id` int NOT NULL,
  `gender` varchar(20) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_pokemon_gender` (`pokemon_id`,`gender`),
  CONSTRAINT `pokemon_genders_ibfk_1` FOREIGN KEY (`pokemon_id`) REFERENCES `pokemon_species` (`pokemon_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=278 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pokemon_genders`
--

LOCK TABLES `pokemon_genders` WRITE;
/*!40000 ALTER TABLE `pokemon_genders` DISABLE KEYS */;
INSERT INTO `pokemon_genders` VALUES (2,1,'Female'),(1,1,'Male'),(4,2,'Female'),(3,2,'Male'),(6,3,'Female'),(5,3,'Male'),(8,4,'Female'),(7,4,'Male'),(10,5,'Female'),(9,5,'Male'),(12,6,'Female'),(11,6,'Male'),(14,7,'Female'),(13,7,'Male'),(16,8,'Female'),(15,8,'Male'),(18,9,'Female'),(17,9,'Male'),(20,10,'Female'),(19,10,'Male'),(22,11,'Female'),(21,11,'Male'),(24,12,'Female'),(23,12,'Male'),(26,13,'Female'),(25,13,'Male'),(28,14,'Female'),(27,14,'Male'),(30,15,'Female'),(29,15,'Male'),(32,16,'Female'),(31,16,'Male'),(34,17,'Female'),(33,17,'Male'),(36,18,'Female'),(35,18,'Male'),(38,19,'Female'),(37,19,'Male'),(40,20,'Female'),(39,20,'Male'),(42,21,'Female'),(41,21,'Male'),(44,22,'Female'),(43,22,'Male'),(46,23,'Female'),(45,23,'Male'),(48,24,'Female'),(47,24,'Male'),(50,25,'Female'),(49,25,'Male'),(52,26,'Female'),(51,26,'Male'),(54,27,'Female'),(53,27,'Male'),(56,28,'Female'),(55,28,'Male'),(57,29,'Female'),(58,30,'Female'),(59,31,'Female'),(60,32,'Male'),(61,33,'Male'),(62,34,'Male'),(64,35,'Female'),(63,35,'Male'),(66,36,'Female'),(65,36,'Male'),(68,37,'Female'),(67,37,'Male'),(70,38,'Female'),(69,38,'Male'),(72,39,'Female'),(71,39,'Male'),(74,40,'Female'),(73,40,'Male'),(76,41,'Female'),(75,41,'Male'),(78,42,'Female'),(77,42,'Male'),(80,43,'Female'),(79,43,'Male'),(82,44,'Female'),(81,44,'Male'),(84,45,'Female'),(83,45,'Male'),(86,46,'Female'),(85,46,'Male'),(88,47,'Female'),(87,47,'Male'),(90,48,'Female'),(89,48,'Male'),(92,49,'Female'),(91,49,'Male'),(94,50,'Female'),(93,50,'Male'),(96,51,'Female'),(95,51,'Male'),(98,52,'Female'),(97,52,'Male'),(100,53,'Female'),(99,53,'Male'),(102,54,'Female'),(101,54,'Male'),(104,55,'Female'),(103,55,'Male'),(106,56,'Female'),(105,56,'Male'),(108,57,'Female'),(107,57,'Male'),(110,58,'Female'),(109,58,'Male'),(112,59,'Female'),(111,59,'Male'),(114,60,'Female'),(113,60,'Male'),(116,61,'Female'),(115,61,'Male'),(118,62,'Female'),(117,62,'Male'),(120,63,'Female'),(119,63,'Male'),(122,64,'Female'),(121,64,'Male'),(124,65,'Female'),(123,65,'Male'),(126,66,'Female'),(125,66,'Male'),(128,67,'Female'),(127,67,'Male'),(130,68,'Female'),(129,68,'Male'),(132,69,'Female'),(131,69,'Male'),(134,70,'Female'),(133,70,'Male'),(136,71,'Female'),(135,71,'Male'),(138,72,'Female'),(137,72,'Male'),(140,73,'Female'),(139,73,'Male'),(142,74,'Female'),(141,74,'Male'),(144,75,'Female'),(143,75,'Male'),(146,76,'Female'),(145,76,'Male'),(148,77,'Female'),(147,77,'Male'),(150,78,'Female'),(149,78,'Male'),(152,79,'Female'),(151,79,'Male'),(154,80,'Female'),(153,80,'Male'),(155,81,'Genderless'),(156,82,'Genderless'),(158,83,'Female'),(157,83,'Male'),(160,84,'Female'),(159,84,'Male'),(162,85,'Female'),(161,85,'Male'),(164,86,'Female'),(163,86,'Male'),(166,87,'Female'),(165,87,'Male'),(168,88,'Female'),(167,88,'Male'),(170,89,'Female'),(169,89,'Male'),(172,90,'Female'),(171,90,'Male'),(174,91,'Female'),(173,91,'Male'),(176,92,'Female'),(175,92,'Male'),(178,93,'Female'),(177,93,'Male'),(180,94,'Female'),(179,94,'Male'),(182,95,'Female'),(181,95,'Male'),(184,96,'Female'),(183,96,'Male'),(186,97,'Female'),(185,97,'Male'),(188,98,'Female'),(187,98,'Male'),(190,99,'Female'),(189,99,'Male'),(191,100,'Genderless'),(192,101,'Genderless'),(194,102,'Female'),(193,102,'Male'),(196,103,'Female'),(195,103,'Male'),(198,104,'Female'),(197,104,'Male'),(200,105,'Female'),(199,105,'Male'),(201,106,'Male'),(202,107,'Male'),(204,108,'Female'),(203,108,'Male'),(206,109,'Female'),(205,109,'Male'),(208,110,'Female'),(207,110,'Male'),(210,111,'Female'),(209,111,'Male'),(212,112,'Female'),(211,112,'Male'),(213,113,'Female'),(215,114,'Female'),(214,114,'Male'),(216,115,'Female'),(218,116,'Female'),(217,116,'Male'),(220,117,'Female'),(219,117,'Male'),(222,118,'Female'),(221,118,'Male'),(224,119,'Female'),(223,119,'Male'),(225,120,'Genderless'),(226,121,'Genderless'),(228,122,'Female'),(227,122,'Male'),(230,123,'Female'),(229,123,'Male'),(231,124,'Female'),(233,125,'Female'),(232,125,'Male'),(235,126,'Female'),(234,126,'Male'),(237,127,'Female'),(236,127,'Male'),(238,128,'Male'),(240,129,'Female'),(239,129,'Male'),(242,130,'Female'),(241,130,'Male'),(244,131,'Female'),(243,131,'Male'),(245,132,'Genderless'),(247,133,'Female'),(246,133,'Male'),(249,134,'Female'),(248,134,'Male'),(251,135,'Female'),(250,135,'Male'),(253,136,'Female'),(252,136,'Male'),(254,137,'Genderless'),(256,138,'Female'),(255,138,'Male'),(258,139,'Female'),(257,139,'Male'),(260,140,'Female'),(259,140,'Male'),(262,141,'Female'),(261,141,'Male'),(264,142,'Female'),(263,142,'Male'),(266,143,'Female'),(265,143,'Male'),(267,144,'Genderless'),(268,145,'Genderless'),(269,146,'Genderless'),(271,147,'Female'),(270,147,'Male'),(273,148,'Female'),(272,148,'Male'),(275,149,'Female'),(274,149,'Male'),(276,150,'Genderless'),(277,151,'Genderless');
/*!40000 ALTER TABLE `pokemon_genders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `type_damage_relations`
--

DROP TABLE IF EXISTS `type_damage_relations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `type_damage_relations` (
  `attacking_type_id` int NOT NULL,
  `defending_type_id` int NOT NULL,
  `multiplier` decimal(2,1) NOT NULL,
  PRIMARY KEY (`attacking_type_id`,`defending_type_id`),
  KEY `defending_type_id` (`defending_type_id`),
  CONSTRAINT `type_damage_relations_ibfk_1` FOREIGN KEY (`attacking_type_id`) REFERENCES `Type` (`type_id`),
  CONSTRAINT `type_damage_relations_ibfk_2` FOREIGN KEY (`defending_type_id`) REFERENCES `Type` (`type_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `type_damage_relations`
--

LOCK TABLES `type_damage_relations` WRITE;
/*!40000 ALTER TABLE `type_damage_relations` DISABLE KEYS */;
INSERT INTO `type_damage_relations` VALUES (1,1,1.0),(1,2,1.0),(1,3,1.0),(1,4,1.0),(1,5,1.0),(1,6,1.0),(1,7,1.0),(1,8,1.0),(1,9,1.0),(1,10,1.0),(1,11,1.0),(1,12,1.0),(1,13,0.5),(1,14,0.0),(1,15,1.0),(1,16,1.0),(1,17,0.5),(1,18,1.0),(2,1,1.0),(2,2,0.5),(2,3,0.5),(2,4,2.0),(2,5,1.0),(2,6,2.0),(2,7,1.0),(2,8,1.0),(2,9,1.0),(2,10,1.0),(2,11,1.0),(2,12,2.0),(2,13,0.5),(2,14,1.0),(2,15,0.5),(2,16,1.0),(2,17,2.0),(2,18,1.0),(3,1,1.0),(3,2,2.0),(3,3,0.5),(3,4,0.5),(3,5,1.0),(3,6,1.0),(3,7,1.0),(3,8,1.0),(3,9,2.0),(3,10,1.0),(3,11,1.0),(3,12,1.0),(3,13,2.0),(3,14,1.0),(3,15,0.5),(3,16,1.0),(3,17,1.0),(3,18,1.0),(4,1,1.0),(4,2,0.5),(4,3,2.0),(4,4,0.5),(4,5,1.0),(4,6,1.0),(4,7,1.0),(4,8,0.5),(4,9,2.0),(4,10,0.5),(4,11,1.0),(4,12,0.5),(4,13,2.0),(4,14,1.0),(4,15,0.5),(4,16,1.0),(4,17,0.5),(4,18,1.0),(5,1,1.0),(5,2,1.0),(5,3,2.0),(5,4,0.5),(5,5,0.5),(5,6,1.0),(5,7,1.0),(5,8,1.0),(5,9,0.0),(5,10,2.0),(5,11,1.0),(5,12,1.0),(5,13,1.0),(5,14,1.0),(5,15,0.5),(5,16,1.0),(5,17,1.0),(5,18,1.0),(6,1,1.0),(6,2,0.5),(6,3,0.5),(6,4,2.0),(6,5,1.0),(6,6,0.5),(6,7,1.0),(6,8,1.0),(6,9,2.0),(6,10,2.0),(6,11,1.0),(6,12,1.0),(6,13,1.0),(6,14,1.0),(6,15,2.0),(6,16,1.0),(6,17,0.5),(6,18,1.0),(7,1,2.0),(7,2,1.0),(7,3,1.0),(7,4,1.0),(7,5,1.0),(7,6,2.0),(7,7,1.0),(7,8,0.5),(7,9,1.0),(7,10,0.5),(7,11,0.5),(7,12,0.5),(7,13,2.0),(7,14,0.0),(7,15,1.0),(7,16,2.0),(7,17,2.0),(7,18,0.5),(8,1,1.0),(8,2,1.0),(8,3,1.0),(8,4,2.0),(8,5,1.0),(8,6,1.0),(8,7,1.0),(8,8,0.5),(8,9,0.5),(8,10,1.0),(8,11,1.0),(8,12,1.0),(8,13,0.5),(8,14,0.5),(8,15,1.0),(8,16,1.0),(8,17,0.0),(8,18,2.0),(9,1,1.0),(9,2,2.0),(9,3,1.0),(9,4,2.0),(9,5,2.0),(9,6,1.0),(9,7,1.0),(9,8,2.0),(9,9,1.0),(9,10,0.0),(9,11,1.0),(9,12,0.5),(9,13,2.0),(9,14,1.0),(9,15,1.0),(9,16,1.0),(9,17,2.0),(9,18,1.0),(10,1,1.0),(10,2,1.0),(10,3,1.0),(10,4,2.0),(10,5,0.5),(10,6,1.0),(10,7,2.0),(10,8,1.0),(10,9,1.0),(10,10,1.0),(10,11,1.0),(10,12,2.0),(10,13,0.5),(10,14,1.0),(10,15,1.0),(10,16,1.0),(10,17,0.5),(10,18,1.0),(11,1,1.0),(11,2,1.0),(11,3,1.0),(11,4,1.0),(11,5,1.0),(11,6,1.0),(11,7,2.0),(11,8,2.0),(11,9,1.0),(11,10,1.0),(11,11,0.5),(11,12,1.0),(11,13,1.0),(11,14,1.0),(11,15,1.0),(11,16,0.0),(11,17,0.5),(11,18,1.0),(12,1,1.0),(12,2,0.5),(12,3,1.0),(12,4,2.0),(12,5,1.0),(12,6,1.0),(12,7,0.5),(12,8,0.5),(12,9,1.0),(12,10,0.5),(12,11,2.0),(12,12,1.0),(12,13,1.0),(12,14,0.5),(12,15,1.0),(12,16,2.0),(12,17,0.5),(12,18,0.5),(13,1,1.0),(13,2,2.0),(13,3,1.0),(13,4,1.0),(13,5,1.0),(13,6,2.0),(13,7,0.5),(13,8,1.0),(13,9,0.5),(13,10,2.0),(13,11,1.0),(13,12,2.0),(13,13,1.0),(13,14,1.0),(13,15,1.0),(13,16,1.0),(13,17,0.5),(13,18,1.0),(14,1,0.0),(14,2,1.0),(14,3,1.0),(14,4,1.0),(14,5,1.0),(14,6,1.0),(14,7,1.0),(14,8,1.0),(14,9,1.0),(14,10,1.0),(14,11,2.0),(14,12,1.0),(14,13,1.0),(14,14,2.0),(14,15,1.0),(14,16,0.5),(14,17,1.0),(14,18,1.0),(15,1,1.0),(15,2,1.0),(15,3,1.0),(15,4,1.0),(15,5,1.0),(15,6,1.0),(15,7,1.0),(15,8,1.0),(15,9,1.0),(15,10,1.0),(15,11,1.0),(15,12,1.0),(15,13,1.0),(15,14,1.0),(15,15,2.0),(15,16,1.0),(15,17,0.5),(15,18,0.0),(16,1,1.0),(16,2,1.0),(16,3,1.0),(16,4,1.0),(16,5,1.0),(16,6,1.0),(16,7,0.5),(16,8,1.0),(16,9,1.0),(16,10,1.0),(16,11,2.0),(16,12,1.0),(16,13,1.0),(16,14,2.0),(16,15,1.0),(16,16,0.5),(16,17,1.0),(16,18,0.5),(17,1,1.0),(17,2,0.5),(17,3,0.5),(17,4,1.0),(17,5,0.5),(17,6,2.0),(17,7,1.0),(17,8,1.0),(17,9,1.0),(17,10,1.0),(17,11,1.0),(17,12,1.0),(17,13,2.0),(17,14,1.0),(17,15,1.0),(17,16,1.0),(17,17,0.5),(17,18,2.0),(18,1,1.0),(18,2,0.5),(18,3,1.0),(18,4,1.0),(18,5,1.0),(18,6,1.0),(18,7,2.0),(18,8,0.5),(18,9,1.0),(18,10,1.0),(18,11,1.0),(18,12,1.0),(18,13,1.0),(18,14,1.0),(18,15,2.0),(18,16,2.0),(18,17,0.5),(18,18,1.0);
/*!40000 ALTER TABLE `type_damage_relations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Current Database: `trainer`
--

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `trainer` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;

USE `trainer`;

--
-- Table structure for table `trainers`
--

DROP TABLE IF EXISTS `trainers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `trainers` (
  `trainer_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `gender` enum('Male','Female','Other') NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `level` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`trainer_id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=35 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `trainers`
--

LOCK TABLES `trainers` WRITE;
/*!40000 ALTER TABLE `trainers` DISABLE KEYS */;
INSERT INTO `trainers` VALUES (33,'Red','Male','aayushmanx123@gmail.com','$2b$10$hcp6rXXV..TCCgmjxxbylO30uoCBHtnyKhLCFMVvizhb1pYCBW0G2',0,'2025-03-23 15:25:40'),(34,'Blue','Male','alternateemail164@gmail.com','$2b$10$18XWkYPTQusbXByvloGSRufLIW2x67dgYcaHS3rIQlUorVBqWc.9e',0,'2025-03-23 15:26:32');
/*!40000 ALTER TABLE `trainers` ENABLE KEYS */;
UNLOCK TABLES;
--
-- Table structure for table `trainer_pokemon`
--

DROP TABLE IF EXISTS `trainer_pokemon`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `trainer_pokemon` (
  `id` int NOT NULL AUTO_INCREMENT,
  `trainer_id` int DEFAULT NULL,
  `pokemon_id` int DEFAULT NULL,
  `nickname` varchar(50) DEFAULT NULL,
  `level` int DEFAULT '5',
  `current_hp` int DEFAULT NULL,
  `max_hp` int DEFAULT NULL,
  `attack` int DEFAULT NULL,
  `defense` int DEFAULT NULL,
  `speed` int DEFAULT NULL,
  `special_atk` int DEFAULT NULL,
  `special_def` int DEFAULT NULL,
  `experience` int DEFAULT '0',
  `status` varchar(20) DEFAULT 'Healthy',
  `position` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `trainer_id` (`trainer_id`),
  CONSTRAINT `trainer_pokemon_ibfk_1` FOREIGN KEY (`trainer_id`) REFERENCES `trainers` (`trainer_id`)
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `trainer_pokemon`
--

LOCK TABLES `trainer_pokemon` WRITE;
/*!40000 ALTER TABLE `trainer_pokemon` DISABLE KEYS */;
INSERT INTO `trainer_pokemon` VALUES (26,33,4,'Charmander',5,39,39,52,43,65,60,50,0,'Healthy',1);
/*!40000 ALTER TABLE `trainer_pokemon` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `trainer_pokemon_moves`
--

DROP TABLE IF EXISTS `trainer_pokemon_moves`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `trainer_pokemon_moves` (
  `id` int NOT NULL AUTO_INCREMENT,
  `trainer_pokemon_id` int DEFAULT NULL,
  `move_id` int DEFAULT NULL,
  `current_pp` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_move_id` (`move_id`),
  KEY `fk_trainer_pokemon` (`trainer_pokemon_id`),
  CONSTRAINT `fk_move_id` FOREIGN KEY (`move_id`) REFERENCES `pokedex`.`Move` (`move_id`),
  CONSTRAINT `fk_trainer_pokemon` FOREIGN KEY (`trainer_pokemon_id`) REFERENCES `trainer_pokemon` (`id`),
  CONSTRAINT `trainer_pokemon_moves_ibfk_1` FOREIGN KEY (`trainer_pokemon_id`) REFERENCES `trainer_pokemon` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=37 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `trainer_pokemon_moves`
--

LOCK TABLES `trainer_pokemon_moves` WRITE;
/*!40000 ALTER TABLE `trainer_pokemon_moves` DISABLE KEYS */;
INSERT INTO `trainer_pokemon_moves` VALUES (34,26,10,35),(35,26,45,40),(36,26,52,25);
/*!40000 ALTER TABLE `trainer_pokemon_moves` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `badges`
--

DROP TABLE IF EXISTS `badges`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `badges` (
  `id` int NOT NULL AUTO_INCREMENT,
  `trainer_id` int DEFAULT NULL,
  `badge_name` varchar(50) DEFAULT NULL,
  `gym_leader` varchar(50) DEFAULT NULL,
  `earned_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `trainer_id` (`trainer_id`),
  CONSTRAINT `badges_ibfk_1` FOREIGN KEY (`trainer_id`) REFERENCES `trainers` (`trainer_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `badges`
--

LOCK TABLES `badges` WRITE;
/*!40000 ALTER TABLE `badges` DISABLE KEYS */;
/*!40000 ALTER TABLE `badges` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `battles`
--

DROP TABLE IF EXISTS `battles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `battles` (
  `battle_id` int NOT NULL AUTO_INCREMENT,
  `trainer_id` int DEFAULT NULL,
  `opponent` varchar(50) DEFAULT NULL,
  `result` enum('Win','Loss','Draw') DEFAULT NULL,
  `battle_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`battle_id`),
  KEY `trainer_id` (`trainer_id`),
  CONSTRAINT `battles_ibfk_1` FOREIGN KEY (`trainer_id`) REFERENCES `trainers` (`trainer_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `battles`
--

LOCK TABLES `battles` WRITE;
/*!40000 ALTER TABLE `battles` DISABLE KEYS */;
/*!40000 ALTER TABLE `battles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `forgotten_moves`
--

DROP TABLE IF EXISTS `forgotten_moves`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `forgotten_moves` (
  `id` int NOT NULL AUTO_INCREMENT,
  `trainer_pokemon_id` int DEFAULT NULL,
  `move_id` int DEFAULT NULL,
  `forgotten_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `trainer_pokemon_id` (`trainer_pokemon_id`),
  CONSTRAINT `forgotten_moves_ibfk_1` FOREIGN KEY (`trainer_pokemon_id`) REFERENCES `trainer_pokemon` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `forgotten_moves`
--

LOCK TABLES `forgotten_moves` WRITE;
/*!40000 ALTER TABLE `forgotten_moves` DISABLE KEYS */;
/*!40000 ALTER TABLE `forgotten_moves` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inventory`
--

DROP TABLE IF EXISTS `inventory`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inventory` (
  `id` int NOT NULL AUTO_INCREMENT,
  `trainer_id` int DEFAULT NULL,
  `item_name` varchar(50) DEFAULT NULL,
  `quantity` int DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `trainer_id` (`trainer_id`),
  CONSTRAINT `inventory_ibfk_1` FOREIGN KEY (`trainer_id`) REFERENCES `trainers` (`trainer_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inventory`
--

LOCK TABLES `inventory` WRITE;
/*!40000 ALTER TABLE `inventory` DISABLE KEYS */;
/*!40000 ALTER TABLE `inventory` ENABLE KEYS */;
UNLOCK TABLES;


/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-04-04 19:09:09
