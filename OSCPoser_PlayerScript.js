const bone_hierarchy = {
  "Hips": {
    "Spine": {
      "Chest": {
        "UpperChest": {
          "Neck": {
            "Head": {
              "LeftEye": {},
              "RightEye": {},
              "Jaw": {} // is it right position?
            }
          },
          "LeftShoulder": {
            "LeftUpperArm": {
              "LeftLowerArm": {
                "LeftHand": {
                  "LeftThumbProximal": {
                    "LeftThumbIntermediate": {
                      "LeftThumbDistal": {}
                    }
                  },
                  "LeftIndexProximal": {
                    "LeftIndexIntermediate": {
                      "LeftIndexDistal": {}
                    }
                  },
                  "LeftMiddleProximal": {
                    "LeftMiddleIntermediate": {
                      "LeftMiddleDistal": {}
                    }
                  },
                  "LeftRingProximal": {
                    "LeftRingIntermediate": {
                      "LeftRingDistal": {}
                    }
                  },
                  "LeftLittleProximal": {
                    "LeftLittleIntermediate": {
                      "LeftLittleDistal": {}
                    }
                  }
                }
              }
            }
          },
          "RightShoulder": {
            "RightUpperArm": {
              "RightLowerArm": {
                "RightHand": {
                  "RightThumbProximal": {
                    "RightThumbIntermediate": {
                      "RightThumbDistal": {}
                    }
                  },
                  "RightIndexProximal": {
                    "RightIndexIntermediate": {
                      "RightIndexDistal": {}
                    }
                  },
                  "RightMiddleProximal": {
                    "RightMiddleIntermediate": {
                      "RightMiddleDistal": {}
                    }
                  },
                  "RightRingProximal": {
                    "RightRingIntermediate": {
                      "RightRingDistal": {}
                    }
                  },
                  "RightLittleProximal": {
                    "RightLittleIntermediate": {
                      "RightLittleDistal": {}
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "LeftUpperLeg": {
      "LeftLowerLeg": {
        "LeftFoot": {
          "LeftToes": {}
        }
      }
    },
    "RightUpperLeg": {
      "RightLowerLeg": {
        "RightFoot": {
          "RightToes": {}
        }
      }
    }
  }
};

let rotation_apply_order = [];

let bone_rotations = {};
let bone_received = {};

function init_rotation_apply_order(hierarchy) {
    for (const bone of Object.keys(hierarchy)) {
        rotation_apply_order.push(bone);
        init_rotation_apply_order(hierarchy[bone]);
    }
}

function get_bone_rotations_from_current_bone(rotations, cur_rotation, bone_hierarchy) {
    for (const key of Object.keys(bone_hierarchy)) {
        let rotation = cur_rotation.clone();
        if (key in bone_rotations) {
            rotation = rotation.multiply(bone_rotations[key]);
        }
        rotations[key] = rotation;
        // call recursively
        get_bone_rotations_from_current_bone(rotations, rotation, bone_hierarchy[key]);
    }
}

function get_bone_rotations_from_root(avatar_rotation) {
    let rotations = {};

    const init_rotation = avatar_rotation; // initialized as avatar rotation
    get_bone_rotations_from_current_bone(rotations, init_rotation, bone_hierarchy);

    return rotations;
}

function set_humanoid_pose() {
    // do nothing if OSC receiver is disabled
    if (!(_.oscHandle.isReceiveEnabled())) {
        return;
    }

    const avatar_rotation = _.getRotation();
    // _.getRotation() may return null
    if (avatar_rotation) {
        const bone_rotations_from_root = get_bone_rotations_from_root(avatar_rotation);

        const now_ms = Date.now();

        // apply only received bones
        for (const key of rotation_apply_order) {
            // ignore too old (over 1 second ago) messages
            if (!(key in bone_received) || (now_ms - bone_received[key] > 1000)) {
                continue;
            }

            const rotation = bone_rotations_from_root[key];
            _.setHumanoidBoneRotationOnFrame(HumanoidBone[key], rotation);
        }
    }
}

function on_receive_vmc_ext_bone_pos(args) {
    if (args.length < 8) {
        _.log("arguments of /VMC/Ext/Bone/Pos is too short" +
              " (8 expected, but " + args.length + ")");
        return;
    }

    const bone_name = args[0].getAsciiString();
    const q_x = args[4].getFloat();
    const q_y = args[5].getFloat();
    const q_z = args[6].getFloat();
    const q_w = args[7].getFloat();

    const rotation = new Quaternion(q_x, q_y, q_z, q_w);
    bone_rotations[bone_name] = rotation;
    bone_received[bone_name] = Date.now();
}

_.oscHandle.onReceive((messages) => {
    for (const msg of messages) {
      if (msg.address === "/VMC/Ext/Bone/Pos") {
          on_receive_vmc_ext_bone_pos(msg.values);
      }
    }
});

_.onFrame((deltaTime) => {
    set_humanoid_pose();
});

init_rotation_apply_order(bone_hierarchy);
