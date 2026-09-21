//region WeatherMotion
/**
 * The arithmetic that moves one particle of ambience across the screen.
 *
 * Every ambient effect in the game - rain, drifting snow, leaves on the wind, embers over a lava
 * flow, motes of light in a dreaming forest - is the same handful of numbers with different values
 * in them. There is no "rain" here and no "snow" here, and that is deliberate: the moment a motion
 * knows what it is depicting, adding a new look means adding a new code path, and the plugin grows
 * a branch per mood. A falling motion pointed at a raindrop is rain; pointed at a leaf it is autumn.
 *
 * **Randomness is handed in rather than drawn here.** Every method below is a pure function of its
 * arguments, which is what lets a test assert an exact position instead of a range. The caller draws
 * four numbers in 0..1 and passes them; a thousand particles a frame make that the caller's
 * bookkeeping anyway.
 *
 * Everything is in screen pixels. A particle does not know where it is on the map, and does not need
 * to - ambience is weather over a camera, not weather over terrain.
 */
class WeatherMotion
{
  /**
   * The edges a particle may enter the screen from.
   *
   * `Leading` is the interesting one: it resolves to whichever edge the player is walking toward, so
   * moving through a snowfall throws snow at the face rather than the back of the head. It is the
   * cheapest trick in ambience and the one most responsible for it reading as weather rather than as
   * decoration drifting past.
   * @type {{Top: string, Left: string, Right: string, Bottom: string, Leading: string}}
   */
  static Edges = {
    Top: 'top',
    Left: 'left',
    Right: 'right',
    Bottom: 'bottom',
    Leading: 'leading',
    Anywhere: 'anywhere',
  };

  /**
   * How far beyond each edge a particle spawns and is retired when its motion does not say.
   *
   * Spawning exactly on the boundary pops a particle into existence in full view of the player, so
   * the margin has to clear *half the drawn sprite* - a particle is anchored at its centre, and
   * anything closer in than that has part of itself on screen at the moment it appears.
   *
   * Which is why this is a per-motion number rather than one shared constant. A raindrop is 18
   * pixels wide and a fog bank is nearly a thousand; a margin generous enough for the second wastes
   * most of the first's lifetime off-screen, and one sized for the first makes the second blink in
   * and out at the edges.
   * @type {number}
   */
  static DefaultMargin = 256;

  /**
   * One complete cycle of a wander, in radians.
   *
   * A particle's phase is rolled as a fraction of a turn rather than as an angle, so that the roll
   * handed in stays an ordinary 0..1 like every other and nothing outside this file has to know
   * that the wander is a sine underneath.
   * @type {number}
   */
  static FullTurn = Math.PI * 2;

  /**
   * Builds a particle at the moment it enters the screen.
   *
   * The particle is a plain object rather than a class instance on purpose. A thousand of these are
   * advanced every frame, and this repo's accessor rules would otherwise put two function calls in
   * front of every field read in the hot loop - for a bag of numbers that no other file is allowed
   * to touch.
   * @param {object} params The motion parameters this particle is born from.
   * @param {{width: number, height: number}} bounds The screen the particle crosses.
   * @param {string} edge The resolved heading edge; never {@link WeatherMotion.Edges.Leading}.
   * @param {{along: number, across: number, speedX: number, speedY: number, scale: number,
   * stagger: number, edge: number, phase: number}} rolls Eight rolls, each 0..1.
   * @returns {object} The newborn particle.
   */
  static spawn(params, bounds, edge, rolls)
  {
    // speed varies per particle so a downpour does not fall as a rigid grid. the jitter is added
    // rather than scaled, so a slow drift and a fast one vary by the same absolute amount and the
    // slow one therefore varies more visibly - which is correct, since a slow particle is on screen
    // long enough for anybody to notice it keeping formation.
    //
    // **The two axes are rolled separately.** Sharing one roll makes the difference between the two
    // speeds a constant, so every particle in the population travels at the same angle and the whole
    // field moves as one rigid sheet - which reads as a hard diagonal line across the screen rather
    // than as weather.
    const speedX = params.speedX + (params.jitterX * rolls.speedX);
    const speedY = params.speedY + (params.jitterY * rolls.speedY);

    // the edge decides which way the particle travels, rather than the two being chosen separately
    // and left to contradict each other. a particle entering from the right while its motion also
    // carries it rightward leaves on the frame it arrives, forever - which is invisible while the
    // player stands still and empties the screen the moment they walk that way.
    const velocityX = WeatherMotion.orientedForEdge(speedX, edge, WeatherMotion.Edges.Left, WeatherMotion.Edges.Right);
    const velocityY = WeatherMotion.orientedForEdge(speedY, edge, WeatherMotion.Edges.Top, WeatherMotion.Edges.Bottom);

    // which edge this particular one comes in through, which for anything travelling diagonally is
    // not necessarily the edge that decided its heading.
    const entry = WeatherMotion.entryEdgeFor(params, bounds, edge, rolls.edge);
    const origin = WeatherMotion.originOn(entry, bounds, rolls, WeatherMotion.marginOf(params), params);

    return {
      x: origin.x,
      y: origin.y,
      velocityX,
      velocityY,
      // which way up this one starts: the angle the whole population shares, plus this one's own
      // departure from it.
      rotation: WeatherMotion.angleFor(params, rolls.tilt),

      // the two axes are scaled apart, so a lumpy shape comes out squat or stretched rather than
      // merely large or small.
      scaleX: WeatherMotion.stretchedSize(params, rolls, rolls.stretchX),
      scaleY: WeatherMotion.stretchedSize(params, rolls, rolls.stretchY),
      opacity: 0,

      // where in its wander this one begins, so a population does not weave in unison.
      phase: rolls.phase * WeatherMotion.FullTurn,

      // how long this one has been alive, for the motions that do not live forever.
      age: 0,

      // how far through turning over it starts, for the motions that turn over at all.
      flipPhase: WeatherMotion.flipPhaseFor(params, rolls.flip),

      // and how far through blinking, for the ones that blink.
      pulsePhase: WeatherMotion.pulsePhaseFor(params, rolls.pulse),

      // which of its lives this is, for the motions that turn into something else.
      stage: 0,

      // how long this one in particular gets, which is what spreads a falling population over a
      // screen rather than landing all of it along one line.
      life: WeatherMotion.lifespanFor(params, rolls.life),

      // held invisible for a random part of a burst, so `power: 500` arrives as weather settling in
      // rather than as five hundred things appearing on one frame.
      stagger: Math.floor(params.staggerFrames * rolls.stagger),

      // whether this one has finished for good, which only ever happens to a layer that is being
      // retired. A living population reseats instead, forever.
      done: false,
    };
  }

  /**
   * Whether every particle of a population has finished for good.
   *
   * Asked of a retiring layer, once per frame, to find out whether it can be thrown away. A layer
   * empties at the pace its own motion travels, so this is a slow yes for some of them: rain and
   * leaves clear in seconds, and fog crawls at a third of a pixel a frame through a queue over a
   * thousand deep and takes a minute or two.
   * @param {object[]} particles The population being asked about.
   * @returns {boolean}
   */
  static isDrained(particles)
  {
    return particles.every(particle => particle.done === true);
  }

  /**
   * Points one axis of a velocity inward from the edge the particle entered by.
   *
   * Magnitude is whatever the motion asked for; only the sign is decided here. An edge on the other
   * axis leaves the value alone, so a raindrop entering from the left still falls downward at the
   * speed it was built to fall at - it simply also drifts to the right while doing it.
   *
   * This is what makes `leading` mean something. Walking east into a snowfall puts the snow in front
   * of you coming toward you, because the edge you are walking toward is the edge it enters from and
   * inward is the only direction it can then go.
   * @param {number} speed The magnitude this axis was built for.
   * @param {string} edge The edge being entered from.
   * @param {string} lowEdge The edge at the low end of this axis.
   * @param {string} highEdge The edge at the high end of this axis.
   * @returns {number}
   */
  static orientedForEdge(speed, edge, lowEdge, highEdge)
  {
    if (edge === lowEdge) return Math.abs(speed);
    if (edge === highEdge) return -Math.abs(speed);

    return speed;
  }

  /**
   * How far beyond the screen a motion begins and ends.
   *
   * A motion that says nothing gets the default, which suits everything the size of a raindrop or a
   * leaf. Anything drawn large enough to be visible from further out than that says so.
   * @param {object} params The motion parameters.
   * @returns {number}
   */
  static marginOf(params)
  {
    if (params.margin === undefined) return WeatherMotion.DefaultMargin;

    return params.margin;
  }

  /**
   * Where on the screen a particle entering from a given edge begins.
   *
   * The two axes are asymmetric on purpose. The axis the particle travels along starts a full margin
   * outside the screen, while the axis it spreads across is distributed over the screen plus a margin
   * at each end - otherwise a particle drifting diagonally would never appear in the corner it was
   * heading for.
   * @param {string} edge The edge being entered from.
   * @param {{width: number, height: number}} bounds The screen the particle crosses.
   * @param {{along: number, across: number}} rolls Where along the edge, and how far back to queue.
   * @param {number} margin How far beyond the edge to begin.
   * @param {object} params The motion parameters, for how deep its entry queue runs.
   * @returns {{x: number, y: number}}
   */
  static originOn(edge, bounds, rolls, margin, params)
  {
    const spreadX = (rolls.along * (bounds.width + (margin * 2))) - margin;
    const spreadY = (rolls.along * (bounds.height + (margin * 2))) - margin;

    // the opening population, scattered over the screen instead of queued at an edge. weather is
    // already going when you walk outside; it does not begin. for anything fast this is barely
    // noticeable, and for anything slow it is the difference between fog and an empty screen - a
    // drift of a tenth of a pixel a frame takes a minute and a half just to reach the edge.
    if (edge === WeatherMotion.Edges.Anywhere)
    {
      return {
        x: rolls.along * bounds.width,
        y: rolls.across * bounds.height,
      };
    }

    // how far back along its own direction of travel this one queues up.
    //
    // Without it every particle re-enters at exactly the same coordinate, and since they all left at
    // different times they re-enter at different times - so the population sorts itself into one
    // band crossing the screen with an empty stretch behind it, over and over. That reads as waves
    // of cloud rather than as a field of it, and no amount of density fixes it because the density
    // is all in the wave.
    const depth = rolls.across * WeatherMotion.entryDepthOf(params);

    if (edge === WeatherMotion.Edges.Top) return { x: spreadX, y: -margin - depth };
    if (edge === WeatherMotion.Edges.Bottom) return { x: spreadX, y: bounds.height + margin + depth };
    if (edge === WeatherMotion.Edges.Left) return { x: -margin - depth, y: spreadY };

    return { x: bounds.width + margin + depth, y: spreadY };
  }

  /**
   * How far back along its travel a particle may queue before entering.
   *
   * None by default, which suits anything numerous enough that the clumping is invisible - a
   * thousand raindrops re-entering at one coordinate still look like rain. It matters for anything
   * sparse and slow, where the population is small enough that its shape is the effect.
   * @param {object} params The motion parameters.
   * @returns {number}
   */
  static entryDepthOf(params)
  {
    if (params.entryDepth === undefined) return 0;

    return params.entryDepth;
  }

  /**
   * How far a particle wanders to either side of its heading, in pixels.
   *
   * None by default, because most weather genuinely does travel in a straight line - rain that
   * weaved would read as broken rather than as lively. It is the ember, the firefly and the bubble
   * that look wrong going straight, and they say so.
   * @param {object} params The motion parameters.
   * @returns {number}
   */
  static swayOf(params)
  {
    if (params.sway === undefined) return 0;

    return params.sway;
  }

  /**
   * How fast a particle works through its wander, in radians per frame.
   *
   * Paired with {@link WeatherMotion.swayOf} rather than folded into it, because the two say
   * genuinely different things: how far it strays, and how leisurely it does so. A wide slow
   * wander is a bubble, a narrow fast one is a spark, and one number could not be both.
   * @param {object} params The motion parameters.
   * @returns {number}
   */
  static swayRateOf(params)
  {
    if (params.swayRate === undefined) return 0;

    return params.swayRate;
  }

  /**
   * How far a particle may be turned from upright when it is born, as a fraction of a full turn.
   *
   * None by default, because most weather has an up. A raindrop rotated at random is not a
   * raindrop, and a leaf is drawn already lying the way leaves lie.
   *
   * It is everything for anything whose shape is arbitrary - a cloud, a fog bank, a splash of
   * light. One at a time they look fine; a screen of them all facing the same way looks like one
   * sprite pasted over and over, which is exactly what it is.
   * @param {object} params The motion parameters.
   * @returns {number}
   */
  static tiltOf(params)
  {
    if (params.tilt === undefined) return 0;

    return params.tilt;
  }

  /**
   * Rebuilds a particle as the thing it turns into, where the old one finished.
   *
   * **This is the one place a particle stops being a closed loop.** Everywhere else a population is
   * fixed and self-replacing: a particle leaves, and the same particle comes back at an edge as
   * itself. A stage is the exception - a shooting star that burns out leaves a sparkle behind it, a
   * raindrop that lands leaves a splash, and in both cases the second thing is a different picture
   * with a different motion that happens to begin exactly where the first one ended.
   *
   * Which is the whole trick: the successor is spawned normally, by all the usual arithmetic, and
   * then simply *moved* to where its predecessor died. Nothing else in the model has to know that
   * stages exist.
   * @param {object} particle The particle whose life has just ended.
   * @param {object} params The successor's motion parameters.
   * @param {{width: number, height: number}} bounds The screen it will live on.
   * @param {object} rolls Fresh rolls for the thing being born.
   * @returns {object} The successor, standing where its predecessor fell.
   */
  static succeed(particle, params, bounds, rolls)
  {
    const born = WeatherMotion.spawn(params, bounds, WeatherMotion.Edges.Anywhere, rolls);

    born.x = particle.x;
    born.y = particle.y;

    // a successor is already where it belongs, so it has nothing to wait for.
    born.stagger = 0;
    born.stage = particle.stage + 1;

    return born;
  }

  /**
   * How much of its speed a particle sheds each frame, as a fraction.
   *
   * None by default: weather falls at terminal velocity, and rain that slowed down on the way past
   * would read as broken.
   *
   * It is for the things that are *spending* something. A shooting star is burning up, so it should
   * be losing speed while it loses brightness - arriving at the end of its life still travelling
   * at full pelt is what makes it read as being switched off rather than as burning out.
   * @param {object} params The motion parameters.
   * @returns {number}
   */
  static dragOf(params)
  {
    if (params.drag === undefined) return 0;

    return params.drag;
  }

  /**
   * How deeply a particle dims as it pulses, as a fraction of its brightness.
   *
   * Steady by default, which is what a raindrop and a cloud shadow and a petal all are.
   *
   * It exists for the things that are *lights* rather than things being lit - a firefly is defined
   * by blinking, and a field of them glowing steadily is a field of fairy lights on a wire. One is
   * a full blackout, which reads as a hard on-off switch; anything short of that keeps the insect
   * faintly visible between blinks, so the eye can follow one across the dark instead of losing it
   * and finding a different one.
   * @param {object} params The motion parameters.
   * @returns {number}
   */
  static pulseOf(params)
  {
    if (params.pulse === undefined) return 0;

    return params.pulse;
  }

  /**
   * How fast a particle works through its pulse, in radians per frame.
   * @param {object} params The motion parameters.
   * @returns {number}
   */
  static pulseRateOf(params)
  {
    if (params.pulseRate === undefined) return 0;

    return params.pulseRate;
  }

  /**
   * Where in its pulse a newborn particle begins.
   *
   * Zero for anything steady, and random for anything that blinks - a population sharing a phase
   * blinks in unison, which is a lighthouse rather than a meadow.
   * @param {object} params The motion parameters.
   * @param {number} roll One roll, 0..1.
   * @returns {number}
   */
  static pulsePhaseFor(params, roll)
  {
    if (WeatherMotion.pulseOf(params) === 0) return 0;

    return roll * WeatherMotion.FullTurn;
  }

  /**
   * How brightly a particle is drawn right now, accounting for where it is in its pulse.
   *
   * Applied at draw time rather than written back onto the particle, because the stored opacity is
   * where the fade-in and the dying fade both live - folding a pulse into it would have a blink
   * permanently darken a firefly that happened to blink while it was still arriving.
   * @param {object} particle The particle being drawn.
   * @param {object} params The motion parameters it was born from.
   * @returns {number}
   */
  static glowFor(particle, params)
  {
    const depth = WeatherMotion.pulseOf(params);

    // most things do not pulse, and the arithmetic below is worth skipping for them.
    if (depth === 0) return particle.opacity;

    // a cosine walked from nought to one and back, so the particle leaves and returns to full
    // brightness rather than jumping there.
    const dip = (1 - Math.cos(particle.pulsePhase)) / 2;

    return particle.opacity * (1 - (depth * dip));
  }

  /**
   * How fast a particle turns over, in radians per frame.
   *
   * Still by default. This is not {@link WeatherMotion.angleFor}'s rotation and not the `roll` that
   * spins a sprite in the picture plane - both of those turn a shape like a wheel, keeping its face
   * toward the player the whole way round. A falling petal or leaf does something else: it turns
   * over, going edge-on and vanishing to a line before opening out the other way.
   *
   * In two dimensions that is a cosine on the horizontal scale, passing through zero and out the
   * far side - where a negative scale draws the picture mirrored, which is exactly what the back of
   * a petal looks like. So the whole effect costs one number and one cosine.
   * @param {object} params The motion parameters.
   * @returns {number}
   */
  static flipOf(params)
  {
    if (params.flip === undefined) return 0;

    return params.flip;
  }

  /**
   * Where in its tumble a newborn particle begins.
   *
   * Zero for anything that does not turn over, because the drawn width is scaled by the cosine of
   * this and a still particle must be scaled by exactly one. Anything that does turn over starts
   * somewhere random, or a whole population goes edge-on at the same instant and the screen blinks.
   * @param {object} params The motion parameters.
   * @param {number} roll One roll, 0..1.
   * @returns {number}
   */
  static flipPhaseFor(params, roll)
  {
    if (WeatherMotion.flipOf(params) === 0) return 0;

    return roll * WeatherMotion.FullTurn;
  }

  /**
   * How wide a particle is drawn right now, accounting for how far it has turned over.
   * @param {object} particle The particle being drawn.
   * @returns {number}
   */
  static facingScaleX(particle)
  {
    return particle.scaleX * Math.cos(particle.flipPhase);
  }

  /**
   * The angle the whole population shares, as a fraction of a full turn.
   *
   * Upright by default. It exists for anything with a *source* - shafts of light all come from the
   * same sun, so they all lean the same way, and one leaning differently is not variety, it is a
   * mistake. That is the opposite of a cloud, which has no correct angle and wants every angle.
   *
   * Paired with {@link WeatherMotion.tiltOf} rather than replacing it: lean is where the population
   * points and tilt is how loosely it agrees, so a few degrees of tilt over a fixed lean reads as
   * light through moving leaves rather than as a rack of identical bars.
   * @param {object} params The motion parameters.
   * @returns {number}
   */
  static leanOf(params)
  {
    if (params.lean === undefined) return 0;

    return params.lean;
  }

  /**
   * Which way up one newborn particle faces.
   * @param {object} params The motion parameters.
   * @param {number} tiltRoll The roll deciding this particle's departure from the shared angle.
   * @returns {number} The rotation, in radians.
   */
  static angleFor(params, tiltRoll)
  {
    const shared = WeatherMotion.leanOf(params);
    const departure = WeatherMotion.tiltOf(params) * tiltRoll;

    return (shared + departure) * WeatherMotion.FullTurn;
  }

  /**
   * How far a particle's two axes may be scaled apart, as a fraction of its size.
   *
   * None by default, so a picture keeps its proportions - which anything recognisable needs. A
   * stretched raindrop is a smear and a squashed leaf is a bug report.
   *
   * Shapes with no correct proportions want it badly. Stretching is what turns one cloud into a
   * dozen different clouds, and it costs nothing but a roll.
   * @param {object} params The motion parameters.
   * @returns {number}
   */
  static stretchOf(params)
  {
    if (params.stretch === undefined) return 0;

    return params.stretch;
  }

  /**
   * The size of one axis of a newborn particle.
   *
   * The layer's own size and jitter decide how big it is; the stretch decides how far this one
   * axis departs from that. Handed the axis roll separately so that both axes share a size and
   * differ only in how they are pulled from it - rolling the size twice instead would let a
   * particle be small on one axis and large on the other for two unrelated reasons.
   * @param {object} params The motion parameters.
   * @param {object} rolls The rolls this particle was born with.
   * @param {number} axisRoll The roll deciding this axis, 0..1.
   * @returns {number}
   */
  static stretchedSize(params, rolls, axisRoll)
  {
    const size = params.scale + (params.scaleJitter * rolls.scale);
    const stretch = WeatherMotion.stretchOf(params);

    return size * (1 + (((axisRoll * 2) - 1) * stretch));
  }

  /**
   * The strongest a particle of this layer ever draws, as an opacity out of 255.
   *
   * Full strength by default, which is what almost everything wants - a raindrop is a raindrop.
   * It matters for anything meant to *shade* rather than to be seen: a cloud shadow drawn at full
   * strength does not darken the ground, it replaces it, and reads as a cloud floating over the
   * world rather than as a shadow lying on it. The difference between the two is entirely whether
   * you can still see what is underneath.
   * @param {object} params The layer parameters.
   * @returns {number}
   */
  static peakOf(params)
  {
    if (params.peakOpacity === undefined) return 255;

    return params.peakOpacity;
  }

  /**
   * How many frames a particle of this motion lives before it is reborn.
   *
   * **None by default, meaning a particle lives until it leaves the screen.** That is the right
   * answer for anything travelling *through* a place - rain crosses and is gone, and giving it a
   * lifetime would only make it wink out mid-fall.
   *
   * It is the wrong answer for anything that happens *in* a place. A wisp rising off dark water or
   * a bubble climbing to the surface has somewhere to stop, and a model that only retires particles
   * at the screen edge cannot express one - the best it can do is send them all the way up and off,
   * which reads as a draught rather than as something local.
   * @param {object} params The motion parameters.
   * @returns {number}
   */
  static lifeOf(params)
  {
    if (params.life === undefined) return 0;

    return params.life;
  }

  /**
   * How many frames of life a particle may be granted on top of the base, at random.
   *
   * None by default, which suits anything whose lifetime is the effect itself - a ripple lasts as
   * long as a ripple lasts.
   *
   * It matters enormously for anything whose death has a *position*. Rain that all lived exactly
   * the same number of frames would all land at the same depth, and a screen of it reads as a
   * waterline across the middle of the world with dry ground beneath. Spreading the lifetime
   * spreads where they land, which is the only thing that makes falling rain cover a screen.
   * @param {object} params The motion parameters.
   * @returns {number}
   */
  static lifeJitterOf(params)
  {
    if (params.lifeJitter === undefined) return 0;

    return params.lifeJitter;
  }

  /**
   * How long one particular particle gets to live.
   *
   * Rolled once at birth and carried on the particle, exactly like its speed and its size - a
   * lifetime is a property of the individual rather than of the motion, for any motion that cares
   * where its particles end up.
   * @param {object} params The motion parameters.
   * @param {number} roll One roll, 0..1.
   * @returns {number} The lifespan in frames, or zero for a particle that never expires.
   */
  static lifespanFor(params, roll)
  {
    const base = WeatherMotion.lifeOf(params);

    // an immortal particle stays immortal however the dice fell.
    if (base === 0) return 0;

    return base + (WeatherMotion.lifeJitterOf(params) * roll);
  }

  /**
   * How much opacity a dying particle sheds each frame.
   *
   * Separate from {@link WeatherMotion.lifeOf} because the two answer different questions - how
   * long it lasts, and how abruptly it goes. A bubble reaching the surface should be quick enough
   * to read as a pop; a wisp guttering out should take almost as long to leave as it took to
   * arrive.
   * @param {object} params The motion parameters.
   * @returns {number}
   */
  static fadeOutOf(params)
  {
    if (params.fadeOut === undefined) return 0;

    return params.fadeOut;
  }

  /**
   * Whether a particle is close enough to the end of its life to be on the way out.
   *
   * Measured as "is there still time to fade from here" rather than against a fixed share of the
   * lifetime, so the fade always finishes exactly as the particle expires. Sized the other way -
   * as a percentage of life - a slow fade on a short-lived particle would still be half-lit when
   * it vanished, which is the blink the fade exists to avoid.
   * @param {object} particle The particle being tested.
   * @param {object} params The motion parameters it was born from.
   * @returns {boolean}
   */
  static isDying(particle, params)
  {
    const { life } = particle;

    // an immortal particle is never on the way out; it simply leaves.
    if (life === 0) return false;

    const fadeOut = WeatherMotion.fadeOutOf(params);

    // nor is one with nothing to fade by, which would otherwise sit at whatever opacity it had.
    if (fadeOut === 0) return false;

    const remaining = life - particle.age;

    return (remaining * fadeOut) <= particle.opacity;
  }

  /**
   * How brightly a particle should be drawn once the weather has been running a while.
   *
   * **A mortal particle already knows.** Settling advances it through its own lifetime, fading it
   * in and out exactly as it will fade in play, so by the end of that its opacity is the honest
   * answer for how old it happens to be. Overwriting it lights the whole population at once, and a
   * map whose weather breathes then opens with every shaft of it blazing in unison before drifting
   * apart over the next few seconds - which is the arrival looking wrong in the one moment the
   * settling exists to get right.
   *
   * Everything else is simply on. A raindrop spawns invisible and fades in so that one respawned
   * near the screen does not blink, but a settled population has long since finished doing that.
   * @param {object} particle The particle being settled.
   * @param {object} params The motion parameters it was born from.
   * @returns {number}
   */
  static settledOpacityFor(particle, params)
  {
    if (particle.life > 0) return particle.opacity;

    return WeatherMotion.peakOf(params);
  }

  /**
   * Whether a particle has lived out its lifetime and should be reborn.
   * @param {object} particle The particle being tested.
   * @param {object} params The motion parameters it was born from.
   * @returns {boolean}
   */
  static hasExpired(particle)
  {
    // a motion that says nothing about a lifetime has particles that only ever leave.
    if (particle.life === 0) return false;

    return particle.age >= particle.life;
  }

  /**
   * Nudges a particle sideways along its wander.
   *
   * **Across the heading, never along it.** A particle that swayed forwards and backwards would
   * speed up and slow down rather than wander, which reads as stuttering. So the wander is applied
   * to whichever axis the motion does *not* mainly travel on: embers climbing weave left and right,
   * motes blowing sideways bob up and down.
   *
   * The displacement is taken as the difference between two points on the sine rather than from its
   * derivative, which costs a second call and buys an `sway` that means exactly what it says - the
   * furthest a particle ever strays from the line it would otherwise have travelled. A knob whose
   * number is a real distance is one an author can set once and predict.
   * @param {object} particle The particle being moved.
   * @param {object} params The motion parameters it was born from.
   */
  static applySway(particle, params)
  {
    const sway = WeatherMotion.swayOf(params);

    // most motions travel dead straight, and skipping the trigonometry for them is most of why
    // this can sit in a loop that runs a thousand times a frame.
    if (sway === 0) return;

    const before = Math.sin(particle.phase);
    particle.phase += WeatherMotion.swayRateOf(params);
    const offset = sway * (Math.sin(particle.phase) - before);

    if (Math.abs(params.speedX) >= Math.abs(params.speedY))
    {
      particle.y += offset;

      return;
    }

    particle.x += offset;
  }

  /**
   * Resolves which edge a particle should enter from this spawn.
   *
   * A motion that names a fixed edge always gets it. `Leading` is resolved against the direction the
   * player is actually travelling, and falls back to the motion's own downhill direction when they
   * are standing still - because a stationary player in a snowfall should still have snow coming from
   * somewhere, and "wherever it falls" is the only honest answer.
   * @param {object} params The motion parameters.
   * @param {{x: number, y: number}} travel How far the player moved this frame, per axis.
   * @returns {string} One of {@link WeatherMotion.Edges}, never `Leading`.
   */
  static resolveEdge(params, travel)
  {
    if (params.edge !== WeatherMotion.Edges.Leading) return params.edge;

    const preferred = WeatherMotion.travelEdgeFor(travel);

    // standing still: fall back to wherever this motion was already headed.
    if (preferred === String.empty) return WeatherMotion.restingEdgeFor(params);

    return preferred;
  }

  /**
   * The edge the player is currently walking toward.
   *
   * The axis the player is committing to more strongly wins, so walking diagonally still picks one
   * edge rather than flickering between two.
   * @param {{x: number, y: number}} travel How far the player moved this frame, per axis.
   * @returns {string} One of the four edges, or {@link String.empty} while standing still.
   */
  static travelEdgeFor(travel)
  {
    if (Math.abs(travel.x) > Math.abs(travel.y))
    {
      return travel.x > 0
        ? WeatherMotion.Edges.Right
        : WeatherMotion.Edges.Left;
    }

    if (travel.y !== 0)
    {
      return travel.y > 0
        ? WeatherMotion.Edges.Bottom
        : WeatherMotion.Edges.Top;
    }

    return String.empty;
  }

  /**
   * Which edge one particle actually comes in through.
   *
   * **A motion travelling diagonally has two upstream edges, not one.** Everything drifting down and
   * to the right arrives either from the left or from the top, and a population drawn entirely from
   * one of them leaves a permanent hole in the opposite corner - nothing entering on the left can
   * ever reach the top right, because it would have had to begin a screen and a half above the
   * world. That hole does not fill in over time and does not look like a bug; it looks like weather
   * that only happens on one half of the map.
   *
   * So the two are shared between, in proportion to how much weather each actually delivers. That
   * is **flux** - the speed through an edge times the length of the edge - rather than speed alone,
   * because a slow drift across a wide screen brings in more than a brisk one down a short side.
   * Weighting by speed alone gets this backwards on any screen that is not square, and leaves the
   * seam visible as a band of extra density along the favoured edge.
   *
   * Read from the authored speeds rather than a particle's jittered ones: the question is what
   * proportion the motion is *for*, and rolling it per particle would only add noise to a ratio.
   * @param {object} params The motion parameters.
   * @param {{width: number, height: number}} bounds The screen being crossed.
   * @param {string} edge The resolved heading edge, which orients the motion.
   * @param {number} roll One roll, 0 inclusive to 1 exclusive as `Math.random` produces it,
   * choosing between the upstream edges.
   * @returns {string} The edge this particle enters through.
   */
  static entryEdgeFor(params, bounds, edge, roll)
  {
    // a motion that appears all over the screen is not entering from anywhere, so it has no
    // upstream edge to be shared between.
    if (edge === WeatherMotion.Edges.Anywhere) return edge;

    // where this motion is actually headed, which the heading edge may have flipped.
    const headingX = WeatherMotion.orientedForEdge(params.speedX, edge, WeatherMotion.Edges.Left, WeatherMotion.Edges.Right);
    const headingY = WeatherMotion.orientedForEdge(params.speedY, edge, WeatherMotion.Edges.Top, WeatherMotion.Edges.Bottom);

    // the side it is coming from on each axis, which is the side it is travelling away from.
    const horizontal = headingX > 0
      ? WeatherMotion.Edges.Left
      : WeatherMotion.Edges.Right;

    const vertical = headingY > 0
      ? WeatherMotion.Edges.Top
      : WeatherMotion.Edges.Bottom;

    const horizontalFlux = Math.abs(headingX) * bounds.height;
    const verticalFlux = Math.abs(headingY) * bounds.width;

    // a motion that travels on neither axis is pure jitter, and has no upstream edge to speak of.
    if (horizontalFlux === 0 && verticalFlux === 0) return edge;

    // a single-axis motion needs no special case: all of the flux is on one side of this
    // comparison, so every roll below one lands on the only edge it could have come through.
    return (roll * (horizontalFlux + verticalFlux)) < horizontalFlux
      ? horizontal
      : vertical;
  }

  /**
   * The edge a motion draws from when nobody is moving.
   *
   * Chosen as the side the particle travels *away* from, so it still crosses the screen rather than
   * spawning at its own destination and retiring immediately.
   * @param {object} params The motion parameters.
   * @returns {string}
   */
  static restingEdgeFor(params)
  {
    if (Math.abs(params.speedX) > Math.abs(params.speedY))
    {
      return params.speedX > 0
        ? WeatherMotion.Edges.Left
        : WeatherMotion.Edges.Right;
    }

    return params.speedY >= 0
      ? WeatherMotion.Edges.Top
      : WeatherMotion.Edges.Bottom;
  }

  /**
   * Moves a particle on by one frame, in place.
   *
   * Mutating rather than returning a fresh particle is a deliberate concession to the hot loop: this
   * runs up to a thousand times a frame, and allocating a thousand short-lived objects sixty times a
   * second is how a plugin starts costing frames. It stays testable because the particle is an
   * ordinary object - hand one in, assert its fields afterward.
   * @param {object} particle The particle to advance.
   * @param {object} params The motion parameters it was born from.
   */
  static advance(particle, params)
  {
    // a staggered particle is waiting its turn to exist, and nothing about it moves until it does.
    if (particle.stagger > 0)
    {
      particle.stagger -= 1;

      return;
    }

    particle.age += 1;
    particle.x += particle.velocityX;
    particle.y += particle.velocityY;

    // whatever it is spending, it has less of it than it did a frame ago.
    const remaining = 1 - WeatherMotion.dragOf(params);
    particle.velocityX *= remaining;
    particle.velocityY *= remaining;
    particle.rotation += params.roll;
    particle.flipPhase += WeatherMotion.flipOf(params);
    particle.pulsePhase += WeatherMotion.pulseRateOf(params);
    particle.scaleX += params.growth;
    particle.scaleY += params.growth;

    // and then the wander, for the motions that have one.
    WeatherMotion.applySway(particle, params);

    // a particle living out its last frames goes the other way, so it thins out rather than being
    // switched off.
    if (WeatherMotion.isDying(particle, params) === true)
    {
      particle.opacity = Math.max(particle.opacity - WeatherMotion.fadeOutOf(params), 0);

      return;
    }

    // fading in rather than appearing means a particle that spawns just off-screen is already at full
    // strength by the time it is visible, while one respawned early does not blink.
    particle.opacity = Math.min(particle.opacity + params.fadeIn, WeatherMotion.peakOf(params));
  }

  /**
   * Determines whether a particle has left the screen and should be reborn.
   *
   * The same margin the particle spawned outside of is used to retire it, so a motion that enters
   * from the top and leaves at the bottom travels exactly the distance it was built to travel.
   * @param {object} particle The particle to test.
   * @param {{width: number, height: number}} bounds The screen the particle crosses.
   * @param {object} params The motion parameters it was born from.
   * @returns {boolean}
   */
  static hasEscaped(particle, bounds, params)
  {
    // the entry queue counts as still being alive, and forgetting that is fatal rather than untidy:
    // a queued particle sits *further out* than the margin by definition, so a bound that stopped at
    // the margin would retire every single one on the frame it was born and replace it with another
    // that was also already past the line. The population never moves and the screen stays empty.
    const margin = WeatherMotion.marginOf(params) + WeatherMotion.entryDepthOf(params);

    if (particle.x < -margin) return true;
    if (particle.x > bounds.width + margin) return true;
    if (particle.y < -margin) return true;

    return particle.y > bounds.height + margin;
  }
}

export default WeatherMotion;
//endregion WeatherMotion