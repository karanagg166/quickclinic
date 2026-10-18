"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const doctorScheduleSchema = new mongoose_1.Schema({
    doctor: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Doctor",
        required: true
    },
    schedule: {
        morning: [{
                startTime: {
                    type: String,
                    required: true
                },
                endTime: {
                    type: String,
                    required: true
                }
            }],
        evening: [{
                startTime: {
                    type: String,
                    required: true
                },
                endTime: {
                    type: String,
                    required: true
                }
            }]
    },
    occupiedSlots: [{
            date: {
                type: Date,
                required: true
            },
            timeSlots: [{
                    timeSlot: {
                        type: String,
                        required: true
                    },
                    appointmentId: {
                        type: mongoose_1.Schema.Types.ObjectId,
                        ref: "Appointment",
                        required: true
                    }
                }]
        }]
});
doctorScheduleSchema.pre('save', function (next) {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    this.occupiedSlots = this.occupiedSlots.filter(slot => {
        const slotDate = new Date(slot.date);
        return slotDate >= startOfToday;
    });
    this.occupiedSlots.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        if (dateA < dateB)
            return -1;
        if (dateA > dateB)
            return 1;
        const timeA = a.timeSlots.length ? a.timeSlots[0].timeSlot : '';
        const timeB = b.timeSlots.length ? b.timeSlots[0].timeSlot : '';
        if (timeA && timeB && /\d{2}:\d{2}/.test(timeA) && /\d{2}:\d{2}/.test(timeB)) {
            return timeA.localeCompare(timeB);
        }
        if (timeA === 'morning' && timeB === 'evening')
            return -1;
        if (timeA === 'evening' && timeB === 'morning')
            return 1;
        return 0;
    });
    this.occupiedSlots.forEach(slot => {
        slot.timeSlots.sort((a, b) => {
            const timeA = a.timeSlot;
            const timeB = b.timeSlot;
            if (/\d{2}:\d{2}/.test(timeA) && /\d{2}:\d{2}/.test(timeB)) {
                return timeA.localeCompare(timeB);
            }
            if (timeA === 'morning' && timeB === 'evening')
                return -1;
            if (timeA === 'evening' && timeB === 'morning')
                return 1;
            return 0;
        });
    });
    next();
});
exports.default = mongoose_1.default.model("DoctorSchedule", doctorScheduleSchema);
//# sourceMappingURL=doctorschedulemodel.js.map