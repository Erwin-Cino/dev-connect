const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth");
const Profile = require("../../models/Profile");
const User = require("../../models/Users");
const { check, validationResult } = require("express-validator");

// @route   GET api/profile/me
// @desc    Get current user's profile
// @access  Private
router.get("/me", auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id }).populate(
      "users",
      ["name", "avatar"]
    );

    if (!profile) {
      return res.status(400).json({ msg: "There is no profile for this user" });
    }

    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @route   POST api/profile
// @desc    Create or update user profile
// @access  Private

router.post(
  "/",
  [
    auth,
    [
      check("status", "Status is required")
        .not()
        .isEmpty(),
      check("skills", "Skills are required")
        .not()
        .isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      handle,
      company,
      website,
      location,
      bio,
      status,
      githubusername,
      skills,
      youtube,
      facebook,
      twitter,
      instagram,
      linkedin
    } = req.body;

    // Build Profile object

    const profileFields = {};
    profileFields.user = req.user.id;
    if (handle) profileFields.handle = handle;
    if (company) profileFields.company = company;
    if (website) profileFields.website = website;
    if (location) profileFields.locaiton = location;
    if (bio) profileFields.bio = bio;
    if (status) profileFields.status = status;
    if (githubusername) profileFields.githubusername = githubusername;
    if (skills) {
      profileFields.skills = skills.split(",").map(skill => skill.trim());
    }

    // build social object
    profileFields.social = {};
    if (youtube) profileFields.social.youtube = youtube;
    if (twitter) profileFields.social.twitter = twitter;
    if (instagram) profileFields.social.instagram = instagram;
    if (linkedin) profileFields.social.linkedin = linkedin;
    if (facebook) profileFields.social.facebook = facebook;

    try {
      let profile = await Profile.findOne({ user: req.user.id });

      if (profile) {
        // Update Profile
        profile = await Profile.findOneAndUpdate(
          { user: req.user.id },
          { $set: profileFields },
          { new: true }
        );

        return res.json(profile);
      }

      //Create
      profile = new Profile(profileFields);
      console.log(req.user.id);
      await profile.save();
      res.json(profile);
    } catch (err) {
      console.log(err.message);
      res.status(500).send("Server Error");
    }
  }
);

// @route   GET api/profile
// @desc    Get all profiles
// @access  Public
// Get all profiles and profile by User ID

router.get("/", async (req, res) => {
  try {
    const profiles = await Profile.find().populate("users", ["name", "avatar"]); //populate from the users collection
    res.json(profiles);
  } catch (err) {
    console.log(err.message);
    res.status(500).send("Server Error");
  }
});

// @route   GET api/profile/user/:user_id
// @desc    Get profile by User ID
// @access  Public
// Get profile by ID

router.get("/user/:user_id", async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.params.user_id
    }).populate("users", ["name", "avatar"]); //populate from the users collection
    res.json(profile);

    if (!profile) return res.status(400).json({ msg: "Profile Not Found" });

    res.json(profile);
  } catch (err) {
    console.log(err.message);

    if (err.kind == "ObjectId")
      return res.status(400).json({ msg: "Profile Not Found" });

    res.status(500).send("Server Error");
  }
});

// @route   DELETE api/profile
// @desc    DELETE A profile,user & posts
// @access  private
// Delete users, profile and posts

router.delete("/", auth, async (req, res) => {
  try {
    // @todo - remove users posts
    //remove profile
    await Profile.findOneAndRemove({ user: req.user.id });
    //remove user
    await User.findOneAndRemove({ _id: req.user.id });
    res.json({ msg: "User deleted" });
  } catch (err) {
    console.log(err.message);
    res.status(500).send("Server Error");
  }
});

// @route   PUT api/profile/experience
// @desc    Add profile experience
// @access  Private

router.put(
  "/experience",
  [
    auth,
    [
      check("title", "Title is required")
        .not()
        .isEmpty(),
      check("company", "Company is required")
        .not()
        .isEmpty(),
      check("from", "From date is required")
        .not()
        .isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      title,
      company,
      location,
      from,
      to,
      current,
      description
    } = req.body;

    const newExp = {
      title,
      company,
      location,
      from,
      to,
      current,
      description
    };

    try {
      const profile = await Profile.findOne({ user: req.user.id });

      profile.experience.unshift(newExp);

      await profile.save();
      res.json(profile);
    } catch (err) {
      console.log(err.message);
      res.status(500).send("Server Error");
    }
  }
);

// @route   UPDATE api/profile/experience
// @desc    Being able to update user experience in profile
// @access  Private

router.post(
  "/experience",
  [
    auth,
    [
      check("title", "Title is required")
        .not()
        .isEmpty(),
      check("company", "Company is required")
        .not()
        .isEmpty(),
      check("from", "From date is required")
        .not()
        .isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      title,
      company,
      location,
      from,
      to,
      current,
      description,
      id
    } = req.body;

    const profileExperience = {};
    if (title) profileExperience.title = title;
    if (company) profileExperience.company = company;
    if (location) profileExperience.location = location;
    if (from) profileExperience.from = from;
    if (to) profileExperience.to = to;
    if (current) profileExperience.current = current;
    if (description) profileExperience.description = description;

    //console.log(profileExperience);

    try {
      let profileExp = await Profile.findOne({
        user: req.user.id
      });

      let searchId = await Profile.findOne({
        profileExp: { experience: { id: req.body.id } }
      });

      //console.log(profileExp);
      console.log(profileExp);

      //experience: { id: id } null
      //experience: { $elemMatch: { id: req.body.id } } null
      //{ user: req.user.id }

      //console.log({ searchId });

      if (profileExp) {
        // Update Profile
        profileExp = await Profile.findOneAndUpdate(
          //{ profileExp: { experience: { id: req.body.id } } },
          { user: req.user.id },
          { $set: profileExperience },
          { new: true }
        );

        return res.json(profileExp);
      }
    } catch (err) {
      console.log(err.message);
      res.status(500).send("Server Error");
    }
  }
);

module.exports = router;
